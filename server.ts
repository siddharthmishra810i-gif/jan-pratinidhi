import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Jan-Pratinidhi API is running" });
  });

  app.get("/api/states/analytics", async (req, res) => {
    try {
       const { prisma } = await import('./src/database/db');
       // Test DB connection
       await prisma.$queryRaw`SELECT 1`;
       
       const states = await prisma.state.findMany({
          include: {
             candidates: {
                select: { party: true, winner: true, id: true, name: true, totalAssets: true, type: true, constituency: true, education: true, criminalCasesCount: true, totalLiabilities: true }
             }
          }
       });

       const analytics = states.map(state => {
          const partyStats: Record<string, number> = {};
          let totalSeats = 0;
          state.candidates.forEach(c => {
             if (c.winner) {
                totalSeats++;
                partyStats[c.party] = (partyStats[c.party] || 0) + 1;
             }
          });
          return {
             id: state.id,
             name: state.name,
             totalSeats,
             partyStats: Object.entries(partyStats).map(([party, seats]) => ({ party, seats })),
             candidates: state.candidates 
               // Filter to just winners or we can pass all and let UI filter
               // .filter(c => c.winner)
               .map(c => ({
                 id: c.id,
                 name: c.name,
                 party: c.party,
                 winner: c.winner,
                 type: c.type,
                 constituency: c.constituency?.name || '',
                 education: c.education,
                 criminalCasesCount: c.criminalCasesCount,
                 totalAssets: c.totalAssets,
                 totalLiabilities: c.totalLiabilities
               }))
          };
       });
       
       res.json({ source: "postgres", data: analytics });
    } catch (e) {
       console.warn("Postgres DB not connected or schema missing. Returning fallback data.");
       res.json({ source: "mock", data: [], error: String(e) });
    }
  });

  app.get("/api/representative/:id", async (req, res) => {
     try {
        const { prisma } = await import('./src/database/db');
        const candidate = await prisma.candidate.findUnique({
           where: { id: req.params.id },
           include: { constituency: true, state: true }
        });
        if (!candidate) {
           return res.status(404).json({ error: "Not found" });
        }
        res.json({ data: candidate });
     } catch (e) {
        res.status(500).json({ error: "DB Error" });
     }
  });

  app.post("/api/ai/query", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
         return res.status(500).json({ reply: "Gemini API key is not configured." });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { query, history = [] } = req.body;
      
      const contents = history.map((msg: any) => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      contents.push({ role: 'user', parts: [{ text: query }] });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
           systemInstruction: "You are an AI assistant for Jan-Pratinidhi, India's Complete Political Transparency Platform. Keep answers professional, concise, and focused on Indian politics.",
        }
      });
      
      res.json({ reply: response.text });
    } catch (error) {
      console.error("AI Query Error:", error);
      res.status(500).json({ reply: "An error occurred while generating the response." });
    }
  });

  // Future API Routes for Prisma/Postgres would be mounted here
  // app.use("/api/auth", authRoutes);
  // app.use("/api/representatives", representativesRoutes);

  // Vite Integration for dev & prod
  if (process.env.NODE_ENV !== "production") {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});
