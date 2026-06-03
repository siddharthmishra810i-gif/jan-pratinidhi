import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { prisma } from "./src/database/db";
import { parseRupees } from "./src/parsers/utils";

async function scrapeUP() {
  console.log("Scraping UP from Myneta using Playwright...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to URL...");
    await page.goto("https://www.myneta.info/uttarpradesh2022/index.php?action=show_winners&sort=default", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    
    console.log("Page loaded. Extracting HTML...");
    const html = await page.content();
    const $w = cheerio.load(html);

    let tables = [];
    $w('table').each((i, tbl) => {
        const firstRowText = $w(tbl).find('tr').first().text().replace(/\s+/g, ' ').toLowerCase();
        if (firstRowText.includes('candidate') || firstRowText.includes('party')) {
           tables.push(tbl);
        }
    });

    console.log(`Found ${tables.length} matching tables.`);
    for (let i = 0; i < tables.length; i++) {
        const rows = $w(tables[i]).find('tr').slice(1).toArray();
        console.log(`Table ${i} has ${rows.length} rows.`);
        console.log($w(rows[0]).text().replace(/\s+/g, ' ').trim());
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}
scrapeUP();
