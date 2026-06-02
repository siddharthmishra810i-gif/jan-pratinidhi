import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
  const c = await prisma.candidate.count();
  const s = await prisma.state.count();
  console.log(`There are ${c} candidates across ${s} states in SQLite db.`);
}
run();
