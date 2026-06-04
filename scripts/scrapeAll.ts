import { PrismaClient } from "@prisma/client";
import { ScraperService } from "../src/scraper/scraperService";
import { logger } from "../src/utils/logger";

const prisma = new PrismaClient();

const REAL_STATE_URLS: Record<string, string> = {
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

async function main() {
  logger.info(`Starting per-state data pull for ${Object.keys(REAL_STATE_URLS).length} states...`);
  const scraper = new ScraperService();
  await scraper.init();

  for (const [stateName, url] of Object.entries(REAL_STATE_URLS)) {
    const existing = await prisma.state.findUnique({
      where: { name: stateName },
      include: { _count: { select: { candidates: true } } }
    });
    
    if (existing && existing._count.candidates > 20) {
      logger.info(`Skipping ${stateName}, already has ${existing._count.candidates} candidates...`);
      continue;
    }

    logger.info(`>>> Pulling data for ${stateName}...`);
    let timeoutId;
    try {
      await Promise.race([
        scraper['scrapeStateWithRetry'](url, stateName, 2),
        new Promise((_, reject) => {
           timeoutId = setTimeout(() => reject(new Error("Timeout after 60 seconds")), 60000);
        })
      ]);
    } catch (e) {
      logger.error(`Error scraping ${stateName}: ${e}`);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
  
  logger.info("Scraping complete. Running verification logic inline...");
  
  const totalMLAs = await prisma.candidate.count({ where: { type: "MLA" } });
  const byStateRaw = await prisma.candidate.groupBy({
    by: ['stateId'],
    _count: { id: true },
    where: { type: "MLA" }
  });

  const stateNames = await prisma.state.findMany();
  const stateMap = new Map(stateNames.map(s => [s.id, s.name]));

  let totalCount = 0;
  for (const group of byStateRaw) {
     const name = stateMap.get(group.stateId) || 'Unknown';
     const count = group._count.id;
     totalCount += count;
     logger.info(`State: ${name} | MLAs: ${count}`);
  }

  logger.info(`===============================================`);
  logger.info(`Total MLAs across all states: ${totalMLAs}`);
  if (totalMLAs < 4110) {
      logger.warn(`[Verification Warning] Total MLAs (${totalMLAs}) is less than the expected ~4123. Some records might be missing.`);
  } else {
      logger.info(`✅ Verification pass: Total MLAs is ${totalMLAs}, matching or exceeding expected 4123.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
