import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

// Basic Levenshtein distance function
function levenshteinDistance(s1: string, s2: string): number {
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[s2.length][s1.length];
}

async function main() {
  const STATES = [
    "Himachal Pradesh", "Uttarakhand", "Punjab", "Jammu and Kashmir",
    "Haryana", "Rajasthan", "Uttar Pradesh", "Gujarat", "Sikkim",
    "Assam", "Arunachal Pradesh", "Nagaland", "Meghalaya", "NCT of Delhi",
    "Delhi", "Tripura", "Mizoram", "Manipur", "Bihar", "West Bengal",
    "Madhya Pradesh", "Chhattisgarh", "Odisha", "Maharashtra", "Telangana",
    "Goa", "Karnataka", "Andhra Pradesh", "Kerala", "Jharkhand", "Tamil Nadu"
  ];
  
  const startTime = Date.now();
  
  for (const stateName of STATES) {
    if (Date.now() - startTime > 10 * 60 * 1000) {
      console.log(`Breaking out early to avoid 10 minute timeout. Restart to resume.`);
      break;
    }

    console.log(`\n\nStarting to fetch PRS data for ${stateName}...`);

    let queryState = stateName;
    if (stateName === 'NCT of Delhi') queryState = 'Delhi';

    try {
      const dbState = await prisma.state.findUnique({
        where: { name: stateName },
        include: { candidates: true }
      });

      if (!dbState) {
        console.error(`State ${stateName} not found in DB!`);
        continue;
      }
      
      const mappedCount = dbState.candidates.filter(c => c.imageUrl !== null && c.imageUrl !== '').length;
      console.log(`State ${stateName} has ${mappedCount} mapped images / details. Proceeding to update rest.`);

      const response = await axios.get(`https://prsindia.org/mlatrack?state=${queryState}`, { timeout: 30000 });
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

      const candidates = await prisma.candidate.findMany({
        where: { stateId: dbState.id, winner: true },
        include: { constituency: true }
      });

      console.log(`Found ${candidates.length} winner candidates for ${stateName} in DB.`);

      const candidatesToUpdate = [];
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
          // try by name without spaces
          dbMatch = candidates.find(c => {
             const dbName = c.name.toLowerCase().replace(/\s+/g, '');
             const pName = prsMla.name.toLowerCase().replace(/\s+/g, '');
             return dbName.includes(pName) || pName.includes(dbName);
          });
        }
        
        if (!dbMatch) {
            // try by name fuzzy match with the raw name
            const sanitizedDbNames = candidates.map(c => ({
              ...c, 
              sanDbName: c.name.toLowerCase().replace(/[^a-z0-9\s]/gi, ''),
              sanPrsName: prsMla.name.toLowerCase().replace(/[^a-z0-9\s]/gi, '')
            }));

            dbMatch = sanitizedDbNames.find(c => c.sanDbName.includes(c.sanPrsName) || c.sanPrsName.includes(c.sanDbName));
        }

        if (!dbMatch) {
            // First, attempt to match using levenshtein directly regardless of constituency
            let bestDistance = 1000;
            const pName = prsMla.name.toLowerCase().replace(/[^a-z0-9]/gi, '');
             
            for (const c of candidates) {
              const cName = c.name.toLowerCase().replace(/[^a-z0-9]/gi, '');
              const dis = levenshteinDistance(pName, cName);
              // Max length that we consider acceptable
              const acceptableDis = Math.min(pName.length, cName.length) * 0.3;
              if (dis < bestDistance && dis <= acceptableDis) {
                  bestDistance = dis;
                  dbMatch = c;
              }
            }
        }
        
        if (!dbMatch) {
            // Last resort: check if any parts match and constituency matches
            const parts = prsMla.name.toLowerCase().replace(/[^a-z0-9]/gi, ' ').split(' ').filter(p => p.length > 3);
            if (parts.length > 0) {
              dbMatch = candidates.find(c => {
                  if (c.constituency.name.toLowerCase() !== prsMla.constituency && 
                      !c.constituency.name.toLowerCase().includes(prsMla.constituency)) return false;
                      
                  const dbName = c.name.toLowerCase().replace(/[^a-z0-9]/gi, ' ');
                  return parts.some(p => dbName.includes(p));
              });
            }
        }

        if (dbMatch) {
          candidatesToUpdate.push({
            id: dbMatch.id,
            imageUrl: prsMla.imgSrc || dbMatch.imageUrl, // keep existing if new one is null
            attendance: prsMla.attendance ?? dbMatch.attendance, // keep existing if new is null
            questionsAsked: prsMla.questionsAsked ?? dbMatch.questionsAsked // keep existing if new is null
          });
          matchCount++;
          // console.log(`[MATCH] Updated ${dbMatch.name}`);
        } else {
          // console.log(`[NO MATCH] Could not map PRS MLA - Name: ${prsMla.originalName}, Const: ${prsMla.constituency}`);
        }
      }

      await Promise.all(candidatesToUpdate.map(async (u) => {
         await prisma.candidate.update({
             where: { id: u.id },
             data: { imageUrl: u.imageUrl, attendance: u.attendance, questionsAsked: u.questionsAsked }
         });
      }));

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
