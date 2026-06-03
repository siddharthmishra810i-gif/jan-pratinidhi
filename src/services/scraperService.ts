import { chromium, Browser, Page } from "playwright";
import * as cheerio from "cheerio";
import { prisma } from "../database/db";

// Rate limiting and retry configs
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const BATCH_SIZE = 5;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retry<T>(fn: () => Promise<T>, retries: number = MAX_RETRIES, delay: number = RETRY_DELAY_MS): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return retry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export class ScraperService {
  private browser: Browser | null = null;
  private progressCallback?: (current: number, total: number, message: string) => void;

  constructor(progressCallback?: (current: number, total: number, message: string) => void) {
    this.progressCallback = progressCallback;
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private reportProgress(current: number, total: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback(current, total, message);
    }
  }

  async scrapeMyNetaStateAssembly(stateUrl: string, stateName: string, year: number) {
    if (!this.browser) await this.init();
    const page = await this.browser!.newPage();

    try {
      await retry(async () => {
        await page.goto(stateUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      });

      const html = await page.content();
      const $ = cheerio.load(html);

      let candidateTables: any[] = [];
      $('table').each((i, tbl) => {
        const firstRowText = $(tbl).find('tr').first().text().replace(/\s+/g, ' ').toLowerCase();
        if (firstRowText.includes('candidate') && firstRowText.includes('party')) {
          candidateTables.push(tbl);
        }
      });

      let totalCandidates = 0;
      let parsedCandidates = 0;

      candidateTables.forEach(t => totalCandidates += $(t).find('tr').length - 1);

      this.reportProgress(0, totalCandidates, `Starting extraction for ${stateName}`);

      const stateRecord = await prisma.state.upsert({
        where: { name: stateName },
        update: {},
        create: { name: stateName }
      });

      const electionRecord = await prisma.election.create({
        data: { year, stateId: stateRecord.id }
      }).catch(async () => {
        return await prisma.election.findFirst({ where: { stateId: stateRecord.id, year } });
      });

      if (!electionRecord) throw new Error("Could not find or create election record.");

      for (const table of candidateTables) {
        const rows = $(table).find('tr').slice(1).toArray();
        for (const row of rows) {
          const cols = $(row).find('td');
          if (cols.length >= 7) {
            const nameRaw = $(cols[1]).text().trim();
            const constituencyStr = $(cols[2]).text().trim();
            const partyStr = $(cols[3]).text().trim();
            const criminalRaw = parseInt($(cols[4]).text().trim(), 10) || 0;
            const educationStr = $(cols[5]).text().trim();

            if (!nameRaw || nameRaw === '0') continue;
            const name = nameRaw.split('~')[0].trim();

            const constituencyRecord = await prisma.constituency.create({
                data: { name: constituencyStr, stateId: stateRecord.id }
            }).catch(async () => prisma.constituency.findFirst({ where: { name: constituencyStr, stateId: stateRecord.id } }));

            if (constituencyRecord) {
              const existing = await prisma.candidate.findFirst({
                where: { name, type: "MLA", stateId: stateRecord.id }
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
                    criminalCasesCount: criminalRaw
                  }
                });
              }
            }
          }
          parsedCandidates++;
          if (parsedCandidates % 10 === 0 || parsedCandidates === totalCandidates) {
            this.reportProgress(parsedCandidates, totalCandidates, `Parsed ${parsedCandidates}/${totalCandidates} for ${stateName}`);
          }
        }
      }

    } catch (e) {
      console.error(`Error scraping ${stateName}:`, e);
    } finally {
      await page.close();
    }
  }

  async runMultiStageScraping() {
    console.log("Starting multi-stage robust scraping process for 4911 representatives...");
    const targets = [
      { stateName: "Assam", year: 2026, url: "https://www.myneta.info/Assam2026/index.php?action=show_winners&sort=default" },
      { stateName: "Chhattisgarh", year: 2023, url: "https://www.myneta.info/Chhattisgarh2023/index.php?action=show_winners&sort=default" },
      // Reduced targets list for brevity in this example service file
    ];
    
    await this.init();

    try {
      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);
        const promises = batch.map(t => this.scrapeMyNetaStateAssembly(t.url, t.stateName, t.year));
        await Promise.allSettled(promises);
      }
    } finally {
      await this.close();
    }
  }
}
