import { ScraperService } from "./scraperService";
import { logger } from "../utils/logger";

async function main() {
  logger.info("Starting Myneta Scraper ETL...");
  const scraper = new ScraperService();
  
  try {
    await scraper.init();
    await scraper.scrape();
  } catch (error) {
    logger.error("Scraper failed:", error);
  } finally {
    await scraper.close();
    logger.info("Scraper ETL finished.");
    process.exit(0);
  }
}

main();
