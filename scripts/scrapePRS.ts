import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

async function main() {
  const STATES = [
    "Himachal Pradesh", "Uttarakhand", "Punjab", "Jammu and Kashmir",
    "Haryana", "Rajasthan", "Uttar Pradesh", "Gujarat", "Sikkim",
    "Assam", "Arunachal Pradesh", "Nagaland", "Meghalaya", "NCT of Delhi",
    "Delhi", "Tripura", "Mizoram", "Manipur", "Bihar", "West Bengal",
    "Madhya Pradesh", "Chhattisgarh", "Odisha", "Maharashtra", "Telangana",
    "Goa", "Karnataka", "Andhra Pradesh", "Kerala", "Jharkhand", "Tamil Nadu"
  ];
  
  for (const stateName of STATES) {
    console.log(`\n\nStarting to fetch PRS data for ${stateName}...`);

    let queryState = stateName;
    if (stateName === 'NCT of Delhi') queryState = 'Delhi';

    try {
      const response = await axios.get(`https://prsindia.org/mlatrack?state=${queryState}`);
      const html = response.data;
      const $ = cheerio.load(html);

      const mlaData = [];

      $('.views-row').each((i, el) => {
        const rawName = $(el).find('.views-field-title-field h3 a').text().trim();
        if (!rawName) return;
        const name = rawName.replace(/\s+/g, " ").toLowerCase();
        
        let imgSrc = $(el).find('.views-field-field-image img').attr('src');
        if (imgSrc && !imgSrc.startsWith('http')) {
          imgSrc = `https://prsindia.org${imgSrc}`;
        }

        const rawConstituency = $(el).find('.views-field-field-net-revenue-railway .field-content').text().trim();
        const constituency = rawConstituency.replace(/\s+/g, " ").toLowerCase();
        
        let attendance = null;
        const attText = $(el).find('.attendance-percent').text().trim();
        if (attText) {
          attendance = parseFloat(attText.replace('%', ''));
        }

        let questionsAsked = null;
        const qsText = $(el).find('.views-field-field-no-of-questions-asked .field-content, .views-field-field-no-of-questions .field-content').text().trim();
        if (qsText) {
          const match = qsText.match(/\d+/);
          if (match) {
            questionsAsked = parseInt(match[0], 10);
          }
        }

        mlaData.push({
          originalName: rawName,
          name,
          imgSrc,
          constituency,
          attendance,
          questionsAsked
        });
      });

      console.log(`Parsed ${mlaData.length} MLAs from PRS India for ${stateName}.`);

      const dbState = await prisma.state.findUnique({
        where: { name: stateName }
      });

      if (!dbState) {
        console.error(`State ${stateName} not found in DB!`);
        continue;
      }

      const candidates = await prisma.candidate.findMany({
        where: { stateId: dbState.id, winner: true },
        include: { constituency: true }
      });

      console.log(`Found ${candidates.length} winner candidates for ${stateName} in DB.`);

      let matchCount = 0;

      for (const prsMla of mlaData) {
        if (!prsMla.imgSrc && prsMla.attendance === null && prsMla.questionsAsked === null) continue;

        // Try finding exact constituency match first
        let dbMatch = candidates.find(c => c.constituency.name.toLowerCase() === prsMla.constituency);

        if (!dbMatch) {
           // try substring
           dbMatch = candidates.find(c => c.constituency.name.toLowerCase().includes(prsMla.constituency) || prsMla.constituency.includes(c.constituency.name.toLowerCase()));
        }

        if (!dbMatch) {
          // try by name
          dbMatch = candidates.find(c => {
             const dbName = c.name.toLowerCase();
             return dbName.includes(prsMla.name) || prsMla.name.includes(dbName);
          });
        }

        if (dbMatch) {
          await prisma.candidate.update({
            where: { id: dbMatch.id },
            data: { 
              imageUrl: prsMla.imgSrc,
              attendance: prsMla.attendance,
              questionsAsked: prsMla.questionsAsked
            }
          });
          matchCount++;
          // console.log(`[MATCH] Updated ${dbMatch.name}`);
        } else {
          console.log(`[NO MATCH] Could not map PRS MLA - Name: ${prsMla.originalName}, Const: ${prsMla.constituency}`);
        }
      }

      console.log(`Successfully mapped ${matchCount} records to DB out of ${mlaData.length}.`);
    } catch(e) {
      console.log(`Error processing ${stateName}: ${e}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
