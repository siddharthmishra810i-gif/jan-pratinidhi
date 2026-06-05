import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "../src/utils/logger";

const prisma = new PrismaClient();

async function scrapeLokSabha() {
   logger.info("Scraping Lok Sabha MPs...");
   let page = 0;
   let hasMore = true;
   let count = 0;
   let electionMap: any = {};
   let stateMap: any = {};

   while (page <= 65) {
       const url = `https://prsindia.org/mptrack?page=${page}`;
       logger.info(`Fetching ${url}`);
       const { data } = await axios.get(url, { timeout: 30000 });
       const $ = cheerio.load(data);
       
       const rows = $('.views-row');
       if (rows.length === 0) {
           break;
       }
       
       for (const row of rows) {
           const el = $(row);
           const rawText = el.text().trim().replace(/\\n/g, ' ').replace(/\\s+/g, ' ');
           
           // Example text: "SS (UBT) Aashtikar Patil Nagesh Bapurao Maharashtra Hingoli 53 years Debates Total 0 Questions 80 Pvt Member Bills 0"
           // Wait, usually the structure is:
           // <div class="views-field views-field-field-image"> <img src="..."> </div>
           // <div class="views-field views-field-field-party"> Party Name </div>
           // <h3 class="views-field views-field-title"> <a href="..."> Name </a> </h3>
           // <div class="views-field views-field-field-state"> State </div>
           // <div class="views-field views-field-field-constituency"> Constituency </div>
           // Let's rely on classes.
           
           let party = el.find('.views-field-field-political-party .field-content').text().trim();
           const name = el.find('.views-field-title-field').text().trim();
           if (!name || name === "Chavan Vasantrao Balwantrao") continue;
           
           let stateStr = el.find('.views-field-field-net-revenue-railway').text().trim();
           if (stateStr.startsWith("State:")) stateStr = stateStr.replace("State:", "").trim();
           
           let constituencyStr = el.find('.views-field-php').text().trim();
           if (constituencyStr.startsWith("Constituency:")) constituencyStr = constituencyStr.replace("Constituency:", "").trim();
           
           let ageStr = el.find('.views-field-php-1').text().trim();
           let age = ageStr ? parseInt(ageStr) : null;
           
           let questionsStr = el.find('.views-field-field-total-expenses-railway .field-content').text().trim();
           let questionsAsked = questionsStr ? parseInt(questionsStr) : null;
           
           let debatesStr = el.find('.views-field-field-author .field-content').text().trim();
           let debates = debatesStr ? parseInt(debatesStr) : null;
           
           let pvtMemberBillsStr = el.find('.views-field-field-source .field-content').text().trim();
           let pvtMemberBills = pvtMemberBillsStr ? parseInt(pvtMemberBillsStr) : null;

           const imgPath = el.find('img').attr('src');
           const imgUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `https://prsindia.org${imgPath}`) : null;
           
           if (!name) continue;

           if (!stateMap[stateStr]) {
              const state = await prisma.state.findFirst({ where: { name: stateStr }});
              if (state) stateMap[stateStr] = state.id;
              else {
                 const s = await prisma.state.create({ data: { name: stateStr }});
                 stateMap[stateStr] = s.id;
              }
           }
           
           const stateId = stateMap[stateStr];
           
           let constituency = await prisma.constituency.findFirst({
               where: { name: constituencyStr, stateId, type: "MP_LS" }
           });
           if (!constituency) {
               constituency = await prisma.constituency.create({
                  data: { name: constituencyStr || "N/A", stateId: stateId, type: "MP_LS" }
               });
           }
           
           if (!electionMap[stateId]) {
              let el = await prisma.election.findFirst({ where: { stateId, year: 2024 } });
              if (!el) el = await prisma.election.create({ data: { stateId, year: 2024 } });
              electionMap[stateId] = el.id;
           }
           
           const electionId = electionMap[stateId];

           const existing = await prisma.candidate.findFirst({
               where: { name, constituencyId: constituency.id, type: "MP_LS" }
           });

           if (!existing) {
               await prisma.candidate.create({
                   data: {
                       name,
                       stateId,
                       constituencyId: constituency.id,
                       electionId,
                       party: party || "IND",
                       winner: true,
                       type: "MP_LS",
                       imageUrl: imgUrl,
                       age: isNaN(age!) ? null : age,
                       questionsAsked: isNaN(questionsAsked!) ? null : questionsAsked,
                       debates: isNaN(debates!) ? null : debates,
                       pvtMemberBills: isNaN(pvtMemberBills!) ? null : pvtMemberBills
                   }
               });
               count++;
           } else {
               await prisma.candidate.update({
                   where: { id: existing.id },
                   data: { 
                       imageUrl: existing.imageUrl ? existing.imageUrl : imgUrl,
                       age: isNaN(age!) ? null : age,
                       questionsAsked: isNaN(questionsAsked!) ? null : questionsAsked,
                       debates: isNaN(debates!) ? null : debates,
                       pvtMemberBills: isNaN(pvtMemberBills!) ? null : pvtMemberBills
                   }
               });
           }
       }
       page++;
   }
   logger.info(`Successfully added/updated ${count} Lok Sabha MPs.`);
}

async function scrapeRajyaSabha() {
   logger.info("Scraping Rajya Sabha MPs...");
   let page = 0;
   let hasMore = true;
   let count = 0;
   let electionMap: any = {};
   let stateMap: any = {};

   while (page <= 30) {
       const url = `https://prsindia.org/mptrack/rajya-sabha?page=${page}`;
       logger.info(`Fetching ${url}`);
       const { data } = await axios.get(url, { timeout: 30000 });
       const $ = cheerio.load(data);
       
       const rows = $('.views-row');
       if (rows.length === 0) {
           break;
       }
       
       for (const row of rows) {
           const el = $(row);
           
           let party = el.find('.views-field-field-political-party .field-content').text().trim() || el.find('.views-field-field-party').text().trim();
           const name = el.find('.views-field-title-field').text().trim() || el.find('.views-field-title').text().trim();
           
           let stateStr = el.find('.views-field-field-net-revenue-railway').text().trim() || el.find('.views-field-field-state').text().trim();
           if (stateStr.startsWith("State:")) stateStr = stateStr.replace("State:", "").trim();
           
           let attendanceStr = el.find('.views-field-field-financial-year .field-content').text().trim(); // Example selector if we see it
           
           let questionsStr = el.find('.views-field-field-total-expenses-railway .field-content').text().trim() || el.find('.views-field-field-questions .field-content').text().trim();
           let questionsAsked = questionsStr ? parseInt(questionsStr) : null;
           
           let debatesStr = el.find('.views-field-field-author .field-content').text().trim() || el.find('.views-field-field-debates .field-content').text().trim();
           let debates = debatesStr ? parseInt(debatesStr) : null;
           
           let pvtMemberBillsStr = el.find('.views-field-field-source .field-content').text().trim() || el.find('.views-field-field-private-member-bills .field-content').text().trim();
           let pvtMemberBills = pvtMemberBillsStr ? parseInt(pvtMemberBillsStr) : null;

           const imgPath = el.find('img').attr('src');
           const imgUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `https://prsindia.org${imgPath}`) : null;
           
           if (!name) continue;

           if (!stateStr) stateStr = "Nominated"; // RS MPs might be nominated without state

           if (!stateMap[stateStr]) {
              const state = await prisma.state.findFirst({ where: { name: stateStr }});
              if (state) stateMap[stateStr] = state.id;
              else {
                 const s = await prisma.state.create({ data: { name: stateStr }});
                 stateMap[stateStr] = s.id;
              }
           }
           
           const stateId = stateMap[stateStr];
           
           let constituency = await prisma.constituency.findFirst({
               where: { name: "Rajya Sabha", stateId, type: "MP_RS" }
           });
           if (!constituency) {
               constituency = await prisma.constituency.create({
                  data: { name: "Rajya Sabha", stateId: stateId, type: "MP_RS" }
               });
           }
           
           if (!electionMap[stateId]) {
              let el = await prisma.election.findFirst({ where: { stateId, year: 2024 } });
              if (!el) el = await prisma.election.create({ data: { stateId, year: 2024 } });
              electionMap[stateId] = el.id;
           }
           
           const electionId = electionMap[stateId];

           const existing = await prisma.candidate.findFirst({
               where: { name, constituencyId: constituency.id, type: "MP_RS" }
           });

           if (!existing) {
               await prisma.candidate.create({
                   data: {
                       name,
                       stateId,
                       constituencyId: constituency.id,
                       electionId,
                       party: party || "N/A",
                       winner: true,
                       type: "MP_RS",
                       imageUrl: imgUrl,
                       questionsAsked: isNaN(questionsAsked!) ? null : questionsAsked,
                       debates: isNaN(debates!) ? null : debates,
                       pvtMemberBills: isNaN(pvtMemberBills!) ? null : pvtMemberBills
                   }
               });
               count++;
           } else {
               await prisma.candidate.update({
                   where: { id: existing.id },
                   data: { 
                       imageUrl: existing.imageUrl ? existing.imageUrl : imgUrl,
                       questionsAsked: isNaN(questionsAsked!) ? null : questionsAsked,
                       debates: isNaN(debates!) ? null : debates,
                       pvtMemberBills: isNaN(pvtMemberBills!) ? null : pvtMemberBills
                   }
               });
           }
       }
       page++;
   }
   logger.info(`Successfully added/updated ${count} Rajya Sabha MPs.`);
}

async function main() {
   await scrapeLokSabha();
   await scrapeRajyaSabha();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
