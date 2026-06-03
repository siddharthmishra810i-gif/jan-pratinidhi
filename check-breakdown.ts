import { prisma } from "./src/database/db";

async function run() {
  const candidates = await prisma.candidate.groupBy({
    by: ['type'],
    _count: { id: true },
  });
  console.log(candidates);
}
run();
