import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { prisma } from "./src/database/db";
import { parseRupees } from "./src/parsers/utils";

const statesToScrape = [
  { stateName: "Assam", year: 2026, url: "https://www.myneta.info/Assam2026/index.php?action=show_winners&sort=default" },
  { stateName: "Chhattisgarh", year: 2023, url: "https://www.myneta.info/Chhattisgarh2023/index.php?action=show_winners&sort=default" },
  { stateName: "Gujarat", year: 2022, url: "https://www.myneta.info/Gujarat2022/index.php?action=show_winners&sort=default" },
  { stateName: "Haryana", year: 2024, url: "https://www.myneta.info/Haryana2024/index.php?action=show_winners&sort=default" },
  { stateName: "Goa", year: 2022, url: "https://www.myneta.info/goa2022/index.php?action=show_winners&sort=default" },
  { stateName: "Himachal Pradesh", year: 2022, url: "https://www.myneta.info/HimachalPradesh2022/index.php?action=show_winners&sort=default" },
  { stateName: "Jammu And Kashmir", year: 2024, url: "https://www.myneta.info/JammuKashmir2024/index.php?action=show_winners&sort=default" },
  { stateName: "Jharkhand", year: 2024, url: "https://www.myneta.info/Jharkhand2024/index.php?action=show_winners&sort=default" },
  { stateName: "Karnataka", year: 2023, url: "https://www.myneta.info/Karnataka2023/index.php?action=show_winners&sort=default" },
  { stateName: "Kerala", year: 2026, url: "https://www.myneta.info/Kerala2026/index.php?action=show_winners&sort=default" },
  { stateName: "Madhya Pradesh", year: 2023, url: "https://www.myneta.info/MadhyaPradesh2023/index.php?action=show_winners&sort=default" },
  { stateName: "Maharashtra", year: 2024, url: "https://www.myneta.info/Maharashtra2024/index.php?action=show_winners&sort=default" },
  { stateName: "Manipur", year: 2022, url: "https://www.myneta.info/manipur2022/index.php?action=show_winners&sort=default" },
  { stateName: "Meghalaya", year: 2023, url: "https://www.myneta.info/Meghalaya2023/index.php?action=show_winners&sort=default" },
  { stateName: "Mizoram", year: 2023, url: "https://www.myneta.info/Mizoram2023/index.php?action=show_winners&sort=default" },
  { stateName: "NCT of Delhi", year: 2025, url: "https://www.myneta.info/Delhi2025/index.php?action=show_winners&sort=default" },
  { stateName: "Nagaland", year: 2023, url: "https://www.myneta.info/Nagaland2023/index.php?action=show_winners&sort=default" },
  { stateName: "Odisha", year: 2024, url: "https://www.myneta.info/Odisha2024/index.php?action=show_winners&sort=default" },
  { stateName: "Punjab", year: 2022, url: "https://www.myneta.info/punjab2022/index.php?action=show_winners&sort=default" },
  { stateName: "Rajasthan", year: 2023, url: "https://www.myneta.info/Rajasthan2023/index.php?action=show_winners&sort=default" },
  { stateName: "Sikkim", year: 2024, url: "https://www.myneta.info/Sikkim2024/index.php?action=show_winners&sort=default" },
  { stateName: "Tamil Nadu", year: 2021, url: "https://www.myneta.info/TamilNadu2021/index.php?action=show_winners&sort=default" },
  { stateName: "Telangana", year: 2023, url: "https://www.myneta.info/Telangana2023/index.php?action=show_winners&sort=default" },
  { stateName: "Tripura", year: 2023, url: "https://www.myneta.info/Tripura2023/index.php?action=show_winners&sort=default" },
  { stateName: "Uttar Pradesh", year: 2022, url: "https://www.myneta.info/uttarpradesh2022/index.php?action=show_winners&sort=default" },
  { stateName: "Uttarakhand", year: 2022, url: "https://www.myneta.info/uttarakhand2022/index.php?action=show_winners&sort=default" },
  { stateName: "West Bengal", year: 2026, url: "https://www.myneta.info/WestBengal2026/index.php?action=show_winners&sort=default" },
];

const statesToScrapeBatch1 = statesToScrape.slice(15);

async function scrapeStatesBatch1() {
  console.log("Starting batch 1 scrape using Playwright...");
  const browser = await chromium.launch({ headless: true });
  
  try {
    for (const { stateName, year, url } of statesToScrapeBatch1) {
      const page = await browser.newPage();
      try {
        console.log(`\nNavigating to ${stateName} (${year})...`);
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        
        console.log("Page loaded. Extracting HTML...");
        const html = await page.content();
        const $w = cheerio.load(html);

        let candidateTables: any[] = [];
        $w('table').each((i, tbl) => {
            const firstRowText = $w(tbl).find('tr').first().text().replace(/\s+/g, ' ').toLowerCase();
            if (firstRowText.includes('candidate') && firstRowText.includes('party')) {
               candidateTables.push(tbl);
            }
        });

        if (candidateTables.length === 0) {
            console.warn(`Candidate table not found for ${stateName}.`);
            await page.close();
            continue;
        }

        const stateRecord = await prisma.state.upsert({
          where: { name: stateName },
          update: {},
          create: { name: stateName }
        });

        const electionRecord = await prisma.election.create({
          data: { year: year, stateId: stateRecord.id }
        }).catch(async () => {
          return await prisma.election.findFirst({ where: { stateId: stateRecord.id, year } });
        });

        if (!electionRecord) {
            console.error(`Failed to get election record for ${stateName}`);
            await page.close();
            continue;
        }

        let addedCount = 0;
        let updateCount = 0;
        let totalRows = 0;

        for (const candidateTable of candidateTables) {
          const rows = $w(candidateTable).find('tr').slice(1).toArray();
          totalRows += rows.length;
          
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

                  if (!nameRaw || nameRaw === '0') continue;

                  const name = nameRaw.split('~')[0].trim();

                  const constituencyRecord = await prisma.constituency.create({
                      data: { name: constituencyStr, stateId: stateRecord.id }
                  }).catch(async () => prisma.constituency.findFirst({ where: { name: constituencyStr, stateId: stateRecord.id } }));

                  if (!constituencyRecord) continue;

                  const existing = await prisma.candidate.findFirst({
                    where: {
                       name,
                       type: "MLA",
                       stateId: stateRecord.id
                    }
                  });

                  if (!existing) {
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
                    addedCount++;
                  } else {
                     updateCount++;
                  }
              }
          }
        }
        
        console.log(`✅ ${stateName}: Added ${addedCount}, Skipped/Updated ${updateCount} (total parsed: ${totalRows})`);
      } catch (err) {
        console.error(`Error scraping ${stateName}:`, err);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

scrapeStatesBatch1();
