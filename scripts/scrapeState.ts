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
  const stateName = process.argv[2];
  if (!stateName || !REAL_STATE_URLS[stateName]) {
    console.error(`Please provide a valid state name. Available: ${Object.keys(REAL_STATE_URLS).join(', ')}`);
    process.exit(1);
  }

  const url = REAL_STATE_URLS[stateName];
  logger.info(`Starting scrape for ${stateName} -> ${url}`);

  const scraper = new ScraperService();
  try {
    await scraper.init();
    await scraper['scrapeState'](url, stateName);
    logger.info(`Successfully finished scraping for ${stateName}`);
  } catch (e) {
    logger.error(`Failed pushing real ${stateName} data: ${e}`);
    process.exit(1);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
