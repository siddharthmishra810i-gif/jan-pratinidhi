import { ScraperService } from './src/scraper/scraperService';
async function run() {
    const s = new ScraperService();
    await s.init();
    await s.scrape();
    await s.close();
}
run();
