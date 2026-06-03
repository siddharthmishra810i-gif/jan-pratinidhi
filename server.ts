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

  const geoCache: Record<string, any> = {};

  app.get("/api/boundaries", async (req, res) => {
    const { level } = req.query;
    if (!level) return res.status(400).json({ error: "Level required" });
    
    const cacheKey = String(level);
    if (geoCache[cacheKey]) {
        return res.json(geoCache[cacheKey]);
    }

    try {
        let url = '';
        if (level === 'india') url = 'https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States';
        else if (level === 'lok_sabha') url = 'https://raw.githubusercontent.com/datameet/maps/master/parliamentary-constituencies/india_pc_2019_simplified.geojson';
        else if (level === 'district') url = 'https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson';
        else if (level === 'assembly') url = 'https://raw.githubusercontent.com/geohacker/india/master/taluk/india_taluk.geojson';
        else return res.status(400).json({ error: "Invalid level" });

        const fetchRes = await fetch(url);
        if (!fetchRes.ok) throw new Error("Failed upstream");
        
        const data = await fetchRes.json();
        
        // Load actual names from our database
        const { prisma } = await import('./src/database/db');
        const dbCandidates = await prisma.candidate.findMany({
            where: { winner: true },
            include: { constituency: true }
        });

        // Transform the geojson based on level simulating PG database enrichment
        data.features = data.features.map((f: any) => {
            const getRealDbMatch = (constituencyName: string, expectedType: 'Lok Sabha' | 'MLA') => {
                 return dbCandidates.find(c => 
                     c.constituency?.name.toLowerCase() === constituencyName.toLowerCase() && 
                     c.type === expectedType
                 );
            };

            const generateDetailedProfile = (name: string, dbMatch?: any) => ({
                age: Math.floor(Math.random() * 30 + 35),
                education: dbMatch?.education || ['Graduate', 'Post Graduate', 'Doctorate', '12th Pass'][Math.floor(Math.random() * 4)],
                profession: ['Social Worker', 'Agriculturist', 'Businessman', 'Lawyer'][Math.floor(Math.random() * 4)],
                assets: dbMatch?.totalAssets || `₹${(Math.random() * 50 + 1).toFixed(1)} Cr`,
                liabilities: dbMatch?.totalLiabilities || `₹${(Math.random() * 5).toFixed(1)} Cr`,
                criminalCases: dbMatch?.criminalCasesCount !== undefined ? parseInt(dbMatch.criminalCasesCount, 10) : (Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0),
                attendance: `${Math.floor(Math.random() * 30 + 70)}%`,
                fundUtilization: `${Math.floor(Math.random() * 20 + 80)}%`,
                projectsCompleted: Math.floor(Math.random() * 100 + 20),
                politicalExperience: `${Math.floor(Math.random() * 20 + 5)} Years`,
                wikipediaSummary: dbMatch ? `Represents ${dbMatch.constituency?.name} from the ${dbMatch.party}.` : `A prominent leader from ${name}, actively involved in regional development, legislature, and public service.`
            });

            if (level === 'india') {
                const stateName = String(f.properties.NAME_1 || f.properties.name || "State").toLowerCase();
                let party = 'Regional';
                const bjpStates = ['rajasthan', 'uttarakhand', 'assam', 'arunachal pradesh', 'tripura', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'madhya pradesh', 'chhattisgarh', 'goa', 'gujarat', 'haryana', 'uttar pradesh', 'odisha'];
                const incStates = ['himachal pradesh', 'karnataka', 'telangana', 'jharkhand'];
                const aapStates = ['delhi', 'nct of delhi', 'punjab'];
                const tmcStates = ['west bengal'];
                const dmkStates = ['tamil nadu'];
                const jduStates = ['bihar'];
                const tdpStates = ['andhra pradesh'];
                const shivSenaStates = ['maharashtra'];
                const cpiStates = ['kerala'];
                
                if (bjpStates.some(s => stateName.includes(s))) party = 'BJP';
                else if (incStates.some(s => stateName.includes(s))) party = 'INC';
                else if (aapStates.some(s => stateName.includes(s))) party = 'AAP';
                else if (tmcStates.some(s => stateName.includes(s))) party = 'TMC';
                else if (dmkStates.some(s => stateName.includes(s))) party = 'DMK';
                else if (jduStates.some(s => stateName.includes(s))) party = 'JDU';
                else if (tdpStates.some(s => stateName.includes(s))) party = 'TDP';
                else if (shivSenaStates.some(s => stateName.includes(s))) party = 'SHIV SENA';
                else if (cpiStates.some(s => stateName.includes(s))) party = 'CPI(M)';

                return {
                    ...f,
                    properties: { ...f.properties, name: f.properties.NAME_1 || f.properties.name, party, representative: "Chief Minister", margin: `${(Math.random() * 10 + 2).toFixed(1)}%`, developmentScore: Math.floor(Math.random() * 40) + 60, population: `${Math.floor(Math.random() * 50 + 10)}M`, type: 'State', ...generateDetailedProfile(f.properties.NAME_1 || f.properties.name) }
                };
            } else if (level === 'lok_sabha') {
                const name = f.properties.PC_NAME || f.properties.PC_NAME_EN || "Constituency";
                const match = getRealDbMatch(name, 'Lok Sabha');
                return {
                    ...f,
                    properties: { ...f.properties, name, party: match ? match.party : ['BJP', 'INC', 'SP', 'TMC', 'DMK'][Math.floor(Math.random() * 5)], representative: match ? match.name : "Member of Parliament", margin: `${(Math.random() * 20 + 1).toFixed(1)}%`, developmentScore: Math.floor(Math.random() * 60) + 40, population: `${Math.floor(Math.random() * 3 + 1)}M`, type: 'Lok Sabha', ...generateDetailedProfile(name, match) }
                };
            } else if (level === 'district') {
                const name = f.properties.NAME_2 || "District";
                return {
                    ...f,
                    properties: { ...f.properties, name, party: ['BJP', 'INC', 'Regional'][Math.floor(Math.random() * 3)], representative: "District Magistrate", margin: '--', developmentScore: Math.floor(Math.random() * 70) + 30, population: `${Math.floor(Math.random() * 5 + 1)}M`, type: 'District', ...generateDetailedProfile(name) }
                };
            } else if (level === 'assembly') {
                const name = f.properties.NAME_3 || "Assembly Constituency";
                const match = getRealDbMatch(name, 'MLA');
                return {
                    ...f,
                    properties: { ...f.properties, name, party: match ? match.party : ['BJP', 'INC', 'AAP', 'TMC', 'SP', 'BSP', 'Regional'][Math.floor(Math.random() * 7)], representative: match ? match.name : "Member of Legislative Assembly", margin: `${(Math.random() * 15 + 1).toFixed(1)}%`, developmentScore: Math.floor(Math.random() * 60) + 40, population: `${Math.floor(Math.random() * 500 + 100)}K`, type: 'Assembly Constituency', ...generateDetailedProfile(name, match) }
                };
            }
            return f;
        });

        geoCache[cacheKey] = data;
        res.json(data);
    } catch (e) {
        console.error("Boundary error:", e);
        res.status(500).json({ error: "Failed to load boundaries. Check PostGIS logs." });
    }
  });

  app.get("/api/states/analytics", async (req, res) => {
    try {
       const { prisma } = await import('./src/database/db');
       // Test DB connection
       await prisma.$queryRaw`SELECT 1`;
       
      const states = await prisma.state.findMany({
         include: {
            candidates: {
               select: { 
                 party: true, 
                 winner: true, 
                 id: true, 
                 name: true, 
                 totalAssets: true, 
                 type: true, 
                 constituency: true, 
                 education: true, 
                 criminalCasesCount: true, 
                 totalLiabilities: true,
                 imageUrl: true
               }
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
                 totalLiabilities: c.totalLiabilities,
                 imageUrl: c.imageUrl
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
