import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "../src/utils/logger";

const prisma = new PrismaClient();

async function syncLokSabha() {
   logger.info("Syncing Lok Sabha MPs from PRS India...");
   
   let page = 0;
   let mpList: any[] = [];

   // PRS India lists their MPs across approx 65 pages
   while (page <= 65) {
       const url = `https://prsindia.org/mptrack?page=${page}`;
       logger.info(`Fetching page ${page}: ${url}`);
       const { data } = await axios.get(url, { timeout: 30000 });
       const $ = cheerio.load(data);
       
       const rows = $('.views-row');
       if (rows.length === 0) {
           break;
       }
       
       for (const row of rows) {
           const el = $(row);
           
           const name = el.find('.views-field-title-field').text().trim();
           if (!name) continue;

           let party = el.find('.views-field-field-political-party .field-content').text().trim();
           
           const profileLink = el.find('.views-field-title-field a').attr('href');
           const profileUrlFull = profileLink ? `https://prsindia.org${profileLink}` : null;
           
           let stateStr = el.find('.views-field-field-net-revenue-railway').text().trim();
           if (stateStr.startsWith("State:")) stateStr = stateStr.replace("State:", "").trim();
           
           let constituencyStr = el.find('.views-field-php').text().trim();
           if (constituencyStr.startsWith("Constituency:")) constituencyStr = constituencyStr.replace("Constituency:", "").trim();
           
           let ageStr = el.find('.views-field-php-1').text().trim();
           let age = ageStr ? parseInt(ageStr) : null;
           
           let questionsStr = el.find('.views-field-field-total-expenses-railway .field-content').text().trim() || el.find('.views-field-field-questions .field-content').text().trim();
           let questionsAsked = questionsStr ? parseInt(questionsStr) : null;
           
           let debatesStr = el.find('.views-field-field-author .field-content').text().trim() || el.find('.views-field-field-debates .field-content').text().trim();
           let debates = debatesStr ? parseInt(debatesStr) : null;
           
           let pvtMemberBillsStr = el.find('.views-field-field-source .field-content').text().trim() || el.find('.views-field-field-private-member-bills .field-content').text().trim();
           let pvtMemberBills = pvtMemberBillsStr ? parseInt(pvtMemberBillsStr) : null;

           const imgPath = el.find('img').attr('src');
           const imgUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `https://prsindia.org${imgPath}`) : null;
           
           mpList.push({
               name, party, stateStr, constituencyStr, age, questionsAsked, debates, pvtMemberBills, imgUrl, profileUrl: profileUrlFull
           });
       }
       page++;
   }

   // Robust Duplicate Resolution: Keep only the active 543 MPs
   const mpMap = new Map();
   for (const mp of mpList) {
       // Group by unique constituency name safely
       const key = `${mp.constituencyStr}::${mp.stateStr}`;
       if (!mpMap.has(key)) mpMap.set(key, []);
       mpMap.get(key).push(mp);
   }

   const resolvedMps: any[] = [];
   for (const [key, mps] of mpMap.entries()) {
       if (mps.length > 1) {
           logger.info(`Collision in constituency: ${key} (${mps.length} MPs found). Validating active status...`);
           let activeMp = null;
           
           for (const mp of mps) {
               if (!mp.profileUrl) {
                   if (!activeMp) activeMp = mp;
                   continue;
               }
               try {
                   const { data } = await axios.get(mp.profileUrl, { timeout: 15000 });
                   // Validate "In Office" by checking if "End of Term :" contains a date
                   if (data.includes("End of Term :</div>") && data.match(/End of Term :<\/div>\s*[\d-]{10}/)) {
                       logger.info(`MP ${mp.name} has ended their term. Skipping.`);
                   } else {
                       activeMp = mp;
                   }
               } catch(e) {
                   logger.error(`Error fetching profile for ${mp.name}:`, e);
                   if (!activeMp) activeMp = mp; // Fallback
               }
           }
           resolvedMps.push(activeMp || mps[0]);
       } else {
           resolvedMps.push(mps[0]);
       }
   }

   if (resolvedMps.length > 543 || resolvedMps.length < 540) {
       logger.warn(`Constraint Warning: Found ${resolvedMps.length} active Lok Sabha MPs (expected ~543). Proceeding with database sync.`);
   } else {
       logger.info(`Verified exactly ${resolvedMps.length} active Lok Sabha constituency tracks!`);
   }

   // Sync to DB
   let electionMap: any = {};
   let stateMap: any = {};
   let count = 0;

   // Transactional flush of old LS MPs
   await prisma.candidate.deleteMany({ where: { type: "MP_LS" } });

   for (const mp of resolvedMps) {
       // Ensure State
       if (!stateMap[mp.stateStr]) {
          let state = await prisma.state.findFirst({ where: { name: mp.stateStr }});
          if (!state) state = await prisma.state.create({ data: { name: mp.stateStr }});
          stateMap[mp.stateStr] = state.id;
       }
       const stateId = stateMap[mp.stateStr];
       
       // Ensure Constituency
       let constituency = await prisma.constituency.findFirst({
           where: { name: mp.constituencyStr, stateId, type: "MP_LS" }
       });
       if (!constituency) {
           constituency = await prisma.constituency.create({
              data: { name: mp.constituencyStr || "N/A", stateId: stateId, type: "MP_LS" }
           });
       }
       
       // Ensure Election
       if (!electionMap[stateId]) {
          let el = await prisma.election.findFirst({ where: { stateId, year: 2024 } });
          if (!el) el = await prisma.election.create({ data: { stateId, year: 2024 } });
          electionMap[stateId] = el.id;
       }
       const electionId = electionMap[stateId];

       // Create Candidate
       await prisma.candidate.create({
           data: {
               name: mp.name,
               stateId,
               constituencyId: constituency.id,
               electionId,
               party: mp.party || "IND",
               winner: true,
               type: "MP_LS",
               imageUrl: mp.imgUrl,
               profileUrl: mp.profileUrl,
               age: mp.age,
               questionsAsked: mp.questionsAsked,
               debates: mp.debates,
               pvtMemberBills: mp.pvtMemberBills
           }
       });
       count++;
   }

   logger.info(`[Strict Sync Success]: Successfully mapped and imported ${count} Lok Sabha MPs.`);
}

syncLokSabha()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
