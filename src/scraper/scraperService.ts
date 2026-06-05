import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "../database/db";
import { logger } from "../utils/logger";
import { parseRupees } from "../parsers/utils";

export class ScraperService {
  private totalScraped: number = 0;

  async init() {
    logger.info("Initializing Myneta Scraper (Axios + Cheerio)...");
  }

  async close() {
    logger.info("Scraping completed.");
  }

  async scrape() {
    // List of states provided by user
    const targetStateUrls: Record<string, string> = {
      "Bihar": "https://www.myneta.info/Bihar2025/index.php?action=show_winners&sort=default",
      "Arunachal Pradesh": "https://www.myneta.info/ArunachalPradesh2024/index.php?action=show_winners&sort=default",
      "Andhra Pradesh": "https://www.myneta.info/AndhraPradesh2024/index.php?action=show_winners&sort=default",
      "Assam": "https://www.myneta.info/Assam2026/index.php?action=show_winners&sort=default",
      "Chhattisgarh": "https://www.myneta.info/Chhattisgarh2023/index.php?action=show_winners&sort=default",
      "Gujarat": "https://www.myneta.info/Gujarat2022/index.php?action=show_winners&sort=default",
      "Haryana": "https://www.myneta.info/Haryana2024/index.php?action=show_winners&sort=default",
      "Goa": "https://www.myneta.info/goa2022/index.php?action=show_winners&sort=default",
      "Himachal Pradesh": "https://www.myneta.info/HimachalPradesh2022/index.php?action=show_winners&sort=default",
      "Jammu And Kashmir": "https://www.myneta.info/JammuKashmir2024/index.php?action=show_winners&sort=default",
      "Jharkhand": "https://www.myneta.info/Jharkhand2024/index.php?action=show_winners&sort=default",
      "Karnataka": "https://www.myneta.info/Karnataka2023/index.php?action=show_winners&sort=default",
      "Kerala": "https://www.myneta.info/Kerala2026/index.php?action=show_winners&sort=default",
      "Madhya Pradesh": "https://www.myneta.info/MadhyaPradesh2023/index.php?action=show_winners&sort=default",
      "Maharashtra": "https://www.myneta.info/Maharashtra2024/index.php?action=show_winners&sort=default",
      "Manipur": "https://www.myneta.info/manipur2022/index.php?action=show_winners&sort=default",
      "Meghalaya": "https://www.myneta.info/Meghalaya2023/index.php?action=show_winners&sort=default",
      "Mizoram": "https://www.myneta.info/Mizoram2023/index.php?action=show_winners&sort=default",
      "NCT of Delhi": "https://www.myneta.info/Delhi2025/index.php?action=show_winners&sort=default",
      "Nagaland": "https://www.myneta.info/Nagaland2023/index.php?action=show_winners&sort=default",
      "Odisha": "https://www.myneta.info/Odisha2024/index.php?action=show_winners&sort=default",
      "Punjab": "https://www.myneta.info/punjab2022/index.php?action=show_winners&sort=default",
      "Rajasthan": "https://www.myneta.info/Rajasthan2023/index.php?action=show_winners&sort=default",
      "Sikkim": "https://www.myneta.info/Sikkim2024/index.php?action=show_winners&sort=default",
      "Tamil Nadu": "https://www.myneta.info/TamilNadu2021/index.php?action=show_winners&sort=default",
      "Telangana": "https://www.myneta.info/Telangana2023/index.php?action=show_winners&sort=default",
      "Tripura": "https://www.myneta.info/Tripura2023/index.php?action=show_winners&sort=default",
      "Uttar Pradesh": "https://www.myneta.info/uttarpradesh2022/index.php?action=show_winners&sort=default",
      "Uttarakhand": "https://www.myneta.info/uttarakhand2022/index.php?action=show_winners&sort=default",
      "West Bengal": "https://www.myneta.info/WestBengal2026/index.php?action=show_winners&sort=default"
    };

    logger.info(`Starting scrape for ${Object.keys(targetStateUrls).length} targeted states...`);

    for (const [stateName, stateUrl] of Object.entries(targetStateUrls)) {
       await this.scrapeStateWithRetry(stateUrl, stateName, 3);
    }
  }

  private async scrapeStateWithRetry(stateUrl: string, stateName: string, retries: number) {
     for (let attempt = 1; attempt <= retries; attempt++) {
        try {
           await this.scrapeState(stateUrl, stateName);
           break; // Success
        } catch (error: any) {
           logger.error(`Attempt ${attempt} failed for ${stateName}: ${error.message}`);
           if (attempt === retries) {
               logger.error(`Exhausted all ${retries} retries for ${stateName}. Skipping.`);
           } else {
               await new Promise(r => setTimeout(r, 2000 * attempt)); // exponential backoff
           }
        }
     }
  }

  private async scrapeState(stateUrl: string, stateName: string) {
    try {
      let winnerUrl = stateUrl;
      let winnerHtml = "";
      let year = new Date().getFullYear();

      if (stateUrl.includes("show_winners")) {
        const { data: directHtml } = await axios.get(stateUrl, { timeout: 60000 });
        winnerHtml = directHtml;
        const yearMatch = winnerUrl.match(/(\d{4})/);
        if (yearMatch) year = parseInt(yearMatch[1], 10);
      } else {
        const { data: indexHtml } = await axios.get(stateUrl, { timeout: 60000 });
        const $ = cheerio.load(indexHtml);
        const firstWinnerLink = $('a:contains("Winners")').first().attr('href');
        
        if (!firstWinnerLink) {
           logger.warn(`No Winners link found for ${stateName} on index page ${stateUrl}`);
           return;
        }
        
        winnerUrl = new URL(firstWinnerLink, 'https://www.myneta.info').href;

        const { data: wHtml } = await axios.get(winnerUrl, { timeout: 60000 });
        winnerHtml = wHtml;
        const yearMatch = winnerUrl.match(/(\d{4})/);
        if (yearMatch) year = parseInt(yearMatch[1], 10);
      }

      const $w = cheerio.load(winnerHtml);

      // Find candidate table by specific headers instead of guessing by first row
      const candidateTables: any[] = [];
      $w('table').each((i, tbl) => {
          const headerText = $w(tbl).find('tr, th, td').text().replace(/\s+/g, ' ').toLowerCase();
          // The winners table has these specific headers
          if (headerText.includes('candidate') && headerText.includes('constituency') && headerText.includes('party')) {
             // We pick the table that actually has multiple candidate rows
             if ($w(tbl).find('tr').length > 10) {
                 candidateTables.push(tbl);
             }
          }
      });

      if (candidateTables.length === 0) {
         logger.warn(`Candidate table not found for ${stateName} at URL: ${winnerUrl}. Looked for headers containing 'candidate' and 'party'.`);
         return;
      }

      // Ensure state is in DB
      let cleanStateName = stateName.replace(/\+/g, ' ').replace(/_/g, ' ');
      if (cleanStateName === 'Chattisgarh') cleanStateName = 'Chhattisgarh';
      if (cleanStateName.toLowerCase() === 'delhi' || cleanStateName === 'NCT OF Delhi') cleanStateName = 'NCT of Delhi';
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
      
      const rows: any[] = [];
      candidateTables.forEach(t => rows.push(...$w(t).find('tr').toArray()));

      let parsedCount = 0;
      const candidatesToUpsert: any[] = [];
      for (const row of rows) {
          const cols = $w(row).find('td');
          if (cols.length >= 6) { // Changed: sometimes they have 6 columns
              const sNoRaw = $w(cols[0]).text().trim();
              if (isNaN(parseInt(sNoRaw, 10))) continue; // Changed: skip rows that aren't numeric serial numbers
              
              const nameRaw = $w(cols[1]).text().trim();
              const profileLink = $w(cols[1]).find('a').attr('href');
              let profileUrl = null;
              if (profileLink) {
                 const urlObj = new URL(stateUrl);
                 profileUrl = `${urlObj.origin}${urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/'))}/${profileLink}`;
              }
              const constituencyStr = $w(cols[2]).text().trim();
              const partyStr = $w(cols[3]).text().trim();
              const criminalRaw = parseInt($w(cols[4]).text().trim(), 10) || 0;
              const educationStr = $w(cols[5]).text().trim();
              const assetsStr = parseRupees($w(cols[6]).text().trim());
              const liabilitiesStr = cols.length >= 8 ? parseRupees($w(cols[7]).text().trim()) : null;

              if (!nameRaw || nameRaw === '0') continue; // Skip header/empty

              const name = nameRaw.split('~')[0].trim();

              const constituencyRecord = await prisma.constituency.upsert({
                  where: { name_stateId_type: { name: constituencyStr, stateId: stateRecord.id, type: "MLA" } },
                  update: {},
                  create: { name: constituencyStr, stateId: stateRecord.id, type: "MLA" }
              });

              if (!constituencyRecord) continue;

              candidatesToUpsert.push({
                 name, constituencyId: constituencyRecord.id, partyStr, educationStr, criminalRaw, assetsStr, liabilitiesStr, profileUrl, constituencyStr
              });
              
              parsedCount++;
              this.totalScraped++;
              if (this.totalScraped % 100 === 0) {
                 logger.info(`[Progress] Processed ${this.totalScraped} representative profiles overall...`);
              }
          }
      }

      await Promise.all(candidatesToUpsert.map(async (c: any) => {
         try {
             await prisma.candidate.upsert({
                where: { name_constituencyId_type: { name: c.name, constituencyId: c.constituencyId, type: "MLA" } },
                update: {
                    party: c.partyStr,
                    winner: true,
                    education: c.educationStr,
                    criminalCasesCount: c.criminalRaw,
                    totalAssets: c.assetsStr,
                    totalLiabilities: c.liabilitiesStr,
                    profileUrl: c.profileUrl
                },
                create: {
                    name: c.name,
                    stateId: stateRecord.id,
                    electionId: electionRecord.id,
                    constituencyId: c.constituencyId,
                    party: c.partyStr,
                    winner: true,
                    type: "MLA",
                    education: c.educationStr,
                    criminalCasesCount: c.criminalRaw,
                    totalAssets: c.assetsStr,
                    totalLiabilities: c.liabilitiesStr,
                    profileUrl: c.profileUrl
                }
             });
         } catch (upsertError: any) {
             logger.warn(`[Validation Warning] Duplicate key / upsert failure for ${c.name} in ${c.constituencyStr}: ${upsertError.message}`);
         }
      }));

      logger.info(`✅ Successfully scraped ${parsedCount} winners for ${cleanStateName} (found ${rows.length} rows originally)`);

    } catch (error: any) {
       logger.error(`Failed to scrape state ${stateName} at ${stateUrl}. Error: ${error.message}${error.response ? ' - Status: ' + error.response.status : ''}`);
    }
  }
}
