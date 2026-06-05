import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runDiagnostics() {
  console.log("Starting diagnostic checks...");

  // 1. Check duplicate constituencies (same name in same state)
  const constituencies = await prisma.constituency.findMany({
    include: { state: true },
  });

  const constTracker = new Map<string, number>();
  const duplicateConstituencies: string[] = [];

  for (const c of constituencies) {
    const key = `${c.state.name} - ${c.name}`;
    if (constTracker.has(key)) {
      constTracker.set(key, constTracker.get(key)! + 1);
      if (constTracker.get(key) === 2) { // only add to dup array once
        duplicateConstituencies.push(key);
      }
    } else {
      constTracker.set(key, 1);
    }
  }

  // 2. Check duplicate candidates (same name in same constituency)
  const candidates = await prisma.candidate.findMany({
    include: { constituency: { include: { state: true } } },
  });

  const repTracker = new Map<string, number>();
  const duplicateReps: string[] = [];

  for (const rep of candidates) {
    if (!rep.constituency) continue;
    const key = `${rep.constituency.state.name} - ${rep.constituency.name} - ${rep.name} (${rep.type})`;
    if (repTracker.has(key)) {
      repTracker.set(key, repTracker.get(key)! + 1);
      if (repTracker.get(key) === 2) {
         duplicateReps.push(key);
      }
    } else {
      repTracker.set(key, 1);
    }
  }
  
  // 3. Stats
  const targetCounts: Record<string, number> = {
      Manipur: 60,
      Punjab: 117,
      Assam: 126,
      Meghalaya: 60,
      Haryana: 90,
      Goa: 40,
      "Jammu and Kashmir": 90,
      Tripura: 60,
      Bihar: 243,
      Telangana: 119,
      "Tamil Nadu": 234,
      Jharkhand: 81,
      Sikkim: 32,
      Karnataka: 224,
      Odisha: 147,
      "Andhra Pradesh": 175,
      "Madhya Pradesh": 230,
      Chhattisgarh: 90,
      "NCT of Delhi": 70,
      Nagaland: 60,
      "Arunachal Pradesh": 60,
      "Himachal Pradesh": 68,
      Maharashtra: 288,
      Mizoram: 40,
      Kerala: 140,
      Rajasthan: 200,
      Gujarat: 182,
      Uttarakhand: 70,
      "Uttar Pradesh": 403,
      "West Bengal": 294
  };

  const stateCountsItems = await prisma.candidate.groupBy({
      by: ['stateId'],
      _count: { _all: true },
      where: { type: 'MLA' }
  });

  const statesData = await prisma.state.findMany();
  const stateIdToName: Record<string, string> = {};
  statesData.forEach(s => stateIdToName[s.id] = s.name);

  // Print results
  console.log("\n================ REPORT ================\n");
  console.log(`Duplicate Constituencies: ${duplicateConstituencies.length}`);
  if (duplicateConstituencies.length > 0) {
      console.log(duplicateConstituencies.slice(0, 20).map(s => ` - ${s}`).join('\n') + (duplicateConstituencies.length > 20 ? "\n ...and more." : ""));
  }

  console.log(`\nDuplicate Representatives: ${duplicateReps.length}`);
  if (duplicateReps.length > 0) {
      console.log(duplicateReps.slice(0, 20).map(s => ` - ${s}`).join('\n') + (duplicateReps.length > 20 ? "\n ...and more." : ""));
  }
  
  console.log(`\nMLA Counts by State`);
  for (const item of stateCountsItems) {
      const sName = stateIdToName[item.stateId];
      if (!sName) continue;
      const tCount = targetCounts[sName] || '???';
      const indicator = item._count._all === tCount ? '✅' : ((item._count._all as number) > (tCount as number) ? '⚠️ (Over)' : '❌ (Under)');
      console.log(` - ${sName}: ${item._count._all} / ${tCount} ${indicator}`);
  }

  console.log("\n========================================\n");
}

runDiagnostics()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
