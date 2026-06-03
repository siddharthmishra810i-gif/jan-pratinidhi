import { PrismaClient } from "@prisma/client";
import { logger } from "../src/utils/logger";

const prisma = new PrismaClient();

async function verifyData() {
  logger.info("Starting verification of MLA data...");
  const totalMLAs = await prisma.candidate.count({ where: { type: "MLA" } });
  const byStateRaw = await prisma.candidate.groupBy({
    by: ['stateId'],
    _count: {
       id: true
    },
    where: {
      type: "MLA"
    }
  });

  const stateNames = await prisma.state.findMany();
  const stateMap = new Map(stateNames.map(s => [s.id, s.name]));

  let totalCount = 0;
  for (const group of byStateRaw) {
     const stateName = stateMap.get(group.stateId) || 'Unknown';
     const count = group._count.id;
     totalCount += count;
     logger.info(`State: ${stateName} | MLAs: ${count}`);
  }

  logger.info(`===============================================`);
  logger.info(`Total MLAs across all states (SQL count): ${totalMLAs}`);
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

