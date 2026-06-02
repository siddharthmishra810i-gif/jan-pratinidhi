import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

// Quick self-check to prevent runtime stealth errors
prisma.$connect()
   .then(() => console.log("Successfully connected to the database"))
   .catch(e => {
       console.error("Failed to connect to the database. Error:", e.message);
   });
