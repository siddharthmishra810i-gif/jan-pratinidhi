import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const ls = await prisma.candidate.findFirst({ where: { type: "Lok Sabha" } });
    console.log("Lok Sabha test:", ls?.name, "Questions:", ls?.questionsAsked, "Age:", ls?.age);
    const rs = await prisma.candidate.findFirst({ where: { type: "Rajya Sabha" } });
    console.log("Rajya Sabha test:", rs?.name, "Questions:", rs?.questionsAsked);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
