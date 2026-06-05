import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "../src/utils/logger";

const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.candidate.findMany({
     where: { type: "MLA", profileUrl: { not: null }, imageUrl: null }
  });
  
  logger.info(`Found ${candidates.length} candidates with a MYNETA profile URL but no image.`);
  
  const startTime = Date.now();
  let matchCount = 0;
  for (const c of candidates) {
       if (Date.now() - startTime > 120000) { // Check for a long-running process
            logger.info("Exiting early to prevent timeout...");
            break;
       }
       try {
           const response = await axios.get(c.profileUrl!, { timeout: 30000 });
           const html = response.data;
           const $ = cheerio.load(html);
           
           // Based on myneta structure, candidates images are usually here
           const rawImg = $('.grid_3 img').attr('src');
           
           if (rawImg && !rawImg.toLowerCase().includes('dummy')) { // avoid dummy images
              const imgUrl = rawImg.startsWith('http') ? rawImg : `https://myneta.info/` + (rawImg.startsWith('../') ? rawImg.substring(3) : rawImg);
              await prisma.candidate.update({
                 where: { id: c.id },
                 data: { imageUrl: imgUrl }
              });
              matchCount++;
              // logger.info(`Mapped image for ${c.name}`);
           }
           
           await new Promise(r => setTimeout(r, 10)); // small delay
       } catch(e: any) {
           logger.error(`Error mapping image for ${c.name} (${c.profileUrl}): ${e.message}`);
       }
  }
  
  logger.info(`Successfully mapped ${matchCount} images!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
