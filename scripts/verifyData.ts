import { PrismaClient } from "@prisma/client";
import { logger } from "../src/utils/logger";

const prisma = new PrismaClient();

async function verifyData() {
  logger.info("Starting verification of MLA data...");
  const totalMLAs = await prisma.candidate.count({ where: { type: "MLA" } });
  const totalMapped = await prisma.candidate.count({ where: { type: "MLA", imageUrl: { not: null } } });
  
  const byStateRaw = await prisma.candidate.groupBy({
    by: ['stateId'],
    _count: {
       id: true,
       imageUrl: true
    },
    where: {
      type: "MLA"
    }
  });

  const stateNames = await prisma.state.findMany();
  const stateMap = new Map(stateNames.map(s => [s.id, s.name]));

  let totalCount = 0;
  let totalMappedCount = 0;
  for (const group of byStateRaw) {
     const stateName = stateMap.get(group.stateId) || 'Unknown';
     const count = group._count.id;
     const mappedCount = group._count.imageUrl;
     totalCount += count;
     totalMappedCount += mappedCount;
     logger.info(`State: ${stateName} | MLAs: ${count} | Mapped Images: ${mappedCount}`);
  }

  logger.info(`===============================================`);
  logger.info(`Total MLAs across all states (SQL count): ${totalMLAs}`);
  logger.info(`Total Mapped Images: ${totalMappedCount}`);
  if (totalMLAs < 4123) {
      logger.warn(`[Verification Warning] Total MLAs (${totalMLAs}) is less than the expected ~4123. Some records might be missing.`);
  } else {
      logger.info(`✅ Verification pass: Total MLAs is ${totalMLAs}, matching or exceeding expected 4123.`);
  }
}

verifyData().catch(e => {
  logger.error(`Error during verification: ${e.message}`);
}).finally(() => {
  prisma.$disconnect();
});

