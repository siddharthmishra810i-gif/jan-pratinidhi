import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "../database/db";
import { logger } from "../utils/logger";
import { parseRupees } from "../parsers/utils";

export class ScraperService {
  async init() {
    logger.info("Initializing Myneta Scraper (Axios + Cheerio)...");
  }

  async close() {
    logger.info("Scraping completed.");
  }

  async scrape() {
    // List of states provided by user
    const targetStateUrls = [
      "https://www.myneta.info/state_assembly.php?state=Andhra%20Pradesh",
      "https://www.myneta.info/state_assembly.php?state=Chattisgarh",
      "https://www.myneta.info/state_assembly.php?state=Haryana",
      "https://www.myneta.info/state_assembly.php?state=Karnataka",
      "https://www.myneta.info/state_assembly.php?state=Manipur",
      "https://www.myneta.info/state_assembly.php?state=Odisha",
      "https://www.myneta.info/state_assembly.php?state=Sikkim",
      "https://www.myneta.info/state_assembly.php?state=Uttarakhand",
      "https://www.myneta.info/state_assembly.php?state=Arunachal%20Pradesh",
      "https://www.myneta.info/state_assembly.php?state=Delhi",
      "https://www.myneta.info/state_assembly.php?state=Himachal%20Pradesh",
      "https://www.myneta.info/state_assembly.php?state=Kerala",
      "https://www.myneta.info/state_assembly.php?state=Meghalaya",
      "https://www.myneta.info/state_assembly.php?state=Puducherry",
      "https://www.myneta.info/state_assembly.php?state=Tamil%20Nadu",
      "https://www.myneta.info/state_assembly.php?state=Uttar%20Pradesh",
      "https://www.myneta.info/state_assembly.php?state=Assam",
      "https://www.myneta.info/state_assembly.php?state=Goa",
      "https://www.myneta.info/state_assembly.php?state=Jammu%20And%20Kashmir",
      "https://www.myneta.info/state_assembly.php?state=Madhya%20Pradesh",
      "https://www.myneta.info/state_assembly.php?state=Mizoram",
      "https://www.myneta.info/state_assembly.php?state=Punjab",
      "https://www.myneta.info/state_assembly.php?state=Telangana",
      "https://www.myneta.info/state_assembly.php?state=West%20Bengal",
      "https://www.myneta.info/state_assembly.php?state=Bihar",
      "https://www.myneta.info/state_assembly.php?state=Gujarat",
      "https://www.myneta.info/state_assembly.php?state=Jharkhand",
      "https://www.myneta.info/state_assembly.php?state=Maharashtra",
      "https://www.myneta.info/state_assembly.php?state=Nagaland",
      "https://www.myneta.info/state_assembly.php?state=Rajasthan",
      "https://www.myneta.info/state_assembly.php?state=Tripura"
    ];

    logger.info(`Starting scrape for ${targetStateUrls.length} targeted states...`);

    for (const stateUrl of targetStateUrls) {
       const decodedUrl = decodeURIComponent(stateUrl);
       const stateNameMatch = decodedUrl.match(/state=([^&]+)/);
       const stateName = stateNameMatch ? stateNameMatch[1] : "Unknown_State";
       
       await this.scrapeState(stateUrl, stateName);
    }
  }

  private async scrapeState(stateUrl: string, stateName: string) {
    try {
      logger.info(`Fetching parent index for ${stateName}: ${stateUrl}`);
      // Add generous timeout
      const { data: indexHtml } = await axios.get(stateUrl, { timeout: 15000 });
      const $ = cheerio.load(indexHtml);

      // Find the "Winners" link for the most recent election
      const firstWinnerLink = $('a:contains("Winners")').first().attr('href');
      
      if (!firstWinnerLink) {
         logger.warn(`No Winners link found for ${stateName} on index page ${stateUrl}`);
         return;
      }
      
      const winnerUrl = new URL(firstWinnerLink, 'https://www.myneta.info').href;
      logger.info(`Fetching winners for ${stateName} -> ${winnerUrl}`);

      const { data: winnerHtml } = await axios.get(winnerUrl, { timeout: 20000 });
      const $w = cheerio.load(winnerHtml);

      // Find candidate table
      let candidateTable = null;
      $w('table').each((i, tbl) => {
          const firstRowText = $w(tbl).find('tr').first().text().replace(/\s+/g, ' ').toLowerCase();
          if (firstRowText.includes('candidate') && firstRowText.includes('party')) {
             candidateTable = tbl;
          }
      });

      if (!candidateTable) {
         logger.warn(`Candidate table not found for ${stateName} at URL: ${winnerUrl}. Looked for headers containing 'candidate' and 'party'.`);
         return;
      }

      // Extract Year based on url e.g. AndhraPradesh2024 -> 2024
      const yearMatch = winnerUrl.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

      // Ensure state is in DB
      let cleanStateName = stateName.replace(/\+/g, ' ').replace(/_/g, ' ');
      // Normalize 'Chattisgarh' to 'Chhattisgarh' if needed, but we'll use whatever URL gave
      if (cleanStateName === 'Chattisgarh') cleanStateName = 'Chhattisgarh';
      if (cleanStateName === 'Delhi') cleanStateName = 'NCT OF Delhi';
      if (cleanStateName === 'Jammu And Kashmir') cleanStateName = 'Jammu and Kashmir';

      const stateRecord = await prisma.state.upsert({
         where: { name: cleanStateName },
         update: {},
         create: { name: cleanStateName }
      });

      const electionRecord = await prisma.election.create({
         data: { year: year, stateId: stateRecord.id }
      }).catch(async () => {
          return await prisma.election.findFirst({ where: { stateId: stateRecord.id, year } });
      });

      if (!electionRecord) return;

      const rows = $w(candidateTable).find('tr').slice(1).toArray();
      logger.info(`Processing ${rows.length} MLAs for ${cleanStateName} (${year})`);

      for (const row of rows) {
          const cols = $w(row).find('td');
          if (cols.length >= 7) {
              const nameRaw = $w(cols[1]).text().trim();
              const constituencyStr = $w(cols[2]).text().trim();
              const partyStr = $w(cols[3]).text().trim();
              const criminalRaw = parseInt($w(cols[4]).text().trim(), 10) || 0;
              const educationStr = $w(cols[5]).text().trim();
              const assetsStr = parseRupees($w(cols[6]).text().trim());
              const liabilitiesStr = cols.length >= 8 ? parseRupees($w(cols[7]).text().trim()) : null;

              if (!nameRaw || nameRaw === '0') continue; // Skip header/empty

              const name = nameRaw.split('~')[0].trim();

              const constituencyRecord = await prisma.constituency.create({
                  data: { name: constituencyStr, stateId: stateRecord.id }
              }).catch(async () => prisma.constituency.findFirst({ where: { name: constituencyStr, stateId: stateRecord.id } }));

              if (!constituencyRecord) continue;

              await prisma.candidate.create({
                  data: {
                      name,
                      stateId: stateRecord.id,
                      electionId: electionRecord.id,
                      constituencyId: constituencyRecord.id,
                      party: partyStr,
                      winner: true,
                      type: "MLA",
                      education: educationStr,
                      criminalCasesCount: criminalRaw,
                      totalAssets: assetsStr,
                      totalLiabilities: liabilitiesStr
                  }
              });
          }
      }

      logger.info(`✅ Successfully scraped ${rows.length} winners for ${cleanStateName}`);

    } catch (error: any) {
       logger.error(`Failed to scrape state ${stateName} at ${stateUrl}. Error: ${error.message}${error.response ? ' - Status: ' + error.response.status : ''}`);
    }
  }
}
