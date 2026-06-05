import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Updating MP_LS to 'Lok Sabha'...");
    const lsRes = await prisma.candidate.updateMany({
        where: { type: "MP_LS" },
        data: { type: "Lok Sabha" }
    });
    console.log(`Updated ${lsRes.count} Lok Sabha MPs.`);

    console.log("Updating MP_RS to 'Rajya Sabha'...");
    const rsRes = await prisma.candidate.updateMany({
        where: { type: "MP_RS" },
        data: { type: "Rajya Sabha" }
    });
    console.log(`Updated ${rsRes.count} Rajya Sabha MPs.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
