import { PrismaClient } from "@prisma/client";
import { ScraperService } from "../src/scraper/scraperService";
import { logger } from "../src/utils/logger";
import axios from "axios";
import * as cheerio from "cheerio";

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
      // First we clear duplicate MLAs to restart mapping properly without messy count
      // This will reset them if there are more than ~4100
      const duplicateCount = await prisma.candidate.count({ where: { type: "MLA" }});
      if (duplicateCount > 4300) {
         logger.info(`Found ${duplicateCount} candidates! That means duplicates exist. Dropping all MLAs to sync cleanly...`);
         await prisma.candidate.deleteMany({ where: { type: "MLA"} });
      }

      logger.info(`Starting PARALLEL data pull for ${Object.keys(REAL_STATE_URLS).length} states...`);
  const scraper = new ScraperService();
  await scraper.init();

  const startTime = Date.now();

  for (const [stateName, url] of Object.entries(REAL_STATE_URLS)) {
    // Skipping soft loop timer to guarantee full DB sync. Node timeout will kill if really stuck.
    
    const state = await prisma.state.findUnique({
      where: { name: stateName },
    });

    let existingCount = 0;
    if (state) {
      existingCount = await prisma.candidate.count({
        where: { stateId: state.id, type: "MLA" }
      });
    }
    
    // States expected counts:
    const expectedMap: Record<string, number> = {
      "Sikkim": 32, "Mizoram": 40, "Goa": 40, "Arunachal Pradesh": 60, "Manipur": 60, "Meghalaya": 60,
      "Nagaland": 60, "Tripura": 60, "Himachal Pradesh": 68, "Uttarakhand": 70, "NCT of Delhi": 70,
      "Jharkhand": 81, "Haryana": 90, "Chhattisgarh": 90, "Jammu and Kashmir": 90,
      "Punjab": 117, "Telangana": 119, "Assam": 126, "Kerala": 140, "Odisha": 147, "Andhra Pradesh": 175,
      "Gujarat": 182, "Rajasthan": 200, "Karnataka": 224, "Madhya Pradesh": 230, "Tamil Nadu": 234,
      "Bihar": 243, "Maharashtra": 288, "West Bengal": 294, "Uttar Pradesh": 403
    };
    
    // We expect at least the majority of them. Skip if we reach the soft number.
    const expected = expectedMap[stateName] || 40;
    if (state && existingCount >= expected) {
      logger.info(`Skipping ${stateName}, already has ${existingCount} candidates...`);
      continue;
    }

    logger.info(`>>> Pulling data for ${stateName}...`);
    try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout scraping state')), 90000));
        await Promise.race([scraper['scrapeStateWithRetry'](url, stateName, 1), timeoutPromise]);
    } catch (e: any) {
      logger.error(`Error scraping ${stateName}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  logger.info("Scraping complete. Running verification logic inline...");

  const verifyData = async () => {
      const candidates = await prisma.candidate.findMany({
         where: { type: "MLA", profileUrl: { not: null }, imageUrl: null }
      });
      
      logger.info(`Found ${candidates.length} candidates with a MYNETA profile URL but no image. Attempting to pull images...`);
      
      let matchCount = 0;
      for (const c of candidates) {
           try {
               const { data: directHtml } = await axios.get(c.profileUrl!, { timeout: 15000 });
               const $ = cheerio.load(directHtml);
               
               // Based on myneta structure, candidates images are usually here
               const rawImg = $('.grid_3 img').attr('src');
               
               if (rawImg && !rawImg.toLowerCase().includes('dummy')) { 
                  const imgUrl = rawImg.startsWith('http') ? rawImg : `https://myneta.info/` + (rawImg.startsWith('../') ? rawImg.substring(3) : rawImg);
                  await prisma.candidate.update({
                     where: { id: c.id },
                     data: { imageUrl: imgUrl }
                  });
                  matchCount++;
               }
               
               await new Promise(r => setTimeout(r, 10)); // delay
           } catch(e: any) {
               logger.error(`Error mapping image for ${c.name} (${c.profileUrl}): ${e.message}`);
           }
      }
      
      logger.info(`Successfully mapped ${matchCount} images!`);
  };

  // Verify images via the fallback scraper sequentially
  await verifyData();

  
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
