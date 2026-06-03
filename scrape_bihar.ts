import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { prisma } from "./src/database/db";
import { parseRupees } from "./src/parsers/utils";

async function scrapeBihar() {
  console.log("Scraping Bihar from Myneta using Playwright...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to URL...");
    await page.goto("https://www.myneta.info/Bihar2025/index.php?action=show_winners&sort=default", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    
    console.log("Page loaded. Extracting HTML...");
    const html = await page.content();
    const $w = cheerio.load(html);

    let candidateTable = null;
    $w('table').each((i, tbl) => {
        const firstRowText = $w(tbl).find('tr').first().text().replace(/\s+/g, ' ').toLowerCase();
        if (firstRowText.includes('candidate') && firstRowText.includes('party')) {
           candidateTable = tbl;
        }
    });

    if (!candidateTable) {
        console.warn("Candidate table not found for Bihar.");
        return;
    }

    const stateName = "Bihar";
    const year = 2025; // They provided Bihar2025

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
        console.error("Failed to get election record");
        return;
    }

    const rows = $w(candidateTable).find('tr').slice(1).toArray();
    console.log(`Processing ${rows.length} MLAs for ${stateName} (${year})`);

    let addedCount = 0;
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

            // Upsert based on name and constituency
            const existing = await prisma.candidate.findFirst({
              where: {
                 name,
                 electionId: electionRecord.id,
                 constituencyId: constituencyRecord.id
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
            }
        }
    }
    
    console.log(`✅ Successfully added ${addedCount} (total parsed: ${rows.length}) winners for Bihar`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

scrapeBihar();
