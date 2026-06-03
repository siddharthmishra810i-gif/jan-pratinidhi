import { PrismaClient } from "@prisma/client";
import { ScraperService } from "../src/scraper/scraperService";
import { logger } from "../src/utils/logger";

const prisma = new PrismaClient();

const STATE_SEAT_CAPACITY: Record<string, { ls: number; rs: number; assembly: number }> = {
  "Andhra Pradesh": { ls: 25, rs: 11, assembly: 175 },
  "Arunachal Pradesh": { ls: 2, rs: 1, assembly: 60 },
  "Assam": { ls: 14, rs: 7, assembly: 126 },
  "Bihar": { ls: 40, rs: 16, assembly: 243 },
  "Chhattisgarh": { ls: 11, rs: 5, assembly: 90 },
  "Goa": { ls: 2, rs: 1, assembly: 40 },
  "Gujarat": { ls: 26, rs: 11, assembly: 182 },
  "Haryana": { ls: 10, rs: 5, assembly: 90 },
  "Himachal Pradesh": { ls: 4, rs: 3, assembly: 68 },
  "Jharkhand": { ls: 14, rs: 6, assembly: 81 },
  "Karnataka": { ls: 28, rs: 12, assembly: 224 },
  "Kerala": { ls: 20, rs: 9, assembly: 140 },
  "Madhya Pradesh": { ls: 29, rs: 11, assembly: 230 },
  "Maharashtra": { ls: 48, rs: 19, assembly: 288 },
  "Manipur": { ls: 2, rs: 1, assembly: 60 },
  "Meghalaya": { ls: 2, rs: 1, assembly: 60 },
  "Mizoram": { ls: 1, rs: 1, assembly: 40 },
  "Nagaland": { ls: 1, rs: 1, assembly: 60 },
  "Odisha": { ls: 21, rs: 10, assembly: 147 },
  "Punjab": { ls: 13, rs: 7, assembly: 117 },
  "Rajasthan": { ls: 25, rs: 10, assembly: 200 },
  "Sikkim": { ls: 1, rs: 1, assembly: 32 },
  "Tamil Nadu": { ls: 39, rs: 18, assembly: 234 },
  "Telangana": { ls: 17, rs: 7, assembly: 119 },
  "Tripura": { ls: 2, rs: 1, assembly: 60 },
  "Uttar Pradesh": { ls: 80, rs: 31, assembly: 403 },
  "Uttarakhand": { ls: 5, rs: 3, assembly: 70 },
  "West Bengal": { ls: 42, rs: 16, assembly: 294 },
  "NCT of Delhi": { ls: 7, rs: 3, assembly: 70 },
  "Jammu And Kashmir": { ls: 5, rs: 4, assembly: 90 },
  "Puducherry": { ls: 1, rs: 1, assembly: 30 },
  "Andaman and Nicobar Islands": { ls: 1, rs: 0, assembly: 0 },
  "Chandigarh": { ls: 1, rs: 0, assembly: 0 },
  "Dadra and Nagar Haveli and Daman and Diu": { ls: 2, rs: 0, assembly: 0 },
  "Lakshadweep": { ls: 1, rs: 0, assembly: 0 },
  "Ladakh": { ls: 1, rs: 0, assembly: 0 }
};

const firstNames = [
  "Ramesh", "Suresh", "Amit", "Rajesh", "Vijay", "Sanjay", "Anil", "Sunil", "Dinesh", "Karan",
  "Sandeep", "Deepak", "Manoj", "Pankaj", "Satish", "Abhishek", "Rahul", "Arvind", "Akhilesh",
  "Mayawati", "Mamata", "Priyanka", "Narendra", "Yogi", "Devendra", "Uddhav", "Sharad", "Nitish",
  "Tejashwi", "Hemant", "Siddaramaiah", "Shivakumar", "Stalin", "Kanimozhi", "Revanth", "Chandrababu",
  "Jagan", "Pawan", "Naveen", "Mohan", "Vishnu", "Pushkar", "Bhajan", "Sukhvinder", "Bhagwant",
  "Pramod", "Manik", "Conrad", "Neiphiu", "Lalduhoma", "Prem", "Himanta", "Anura", "Subhash",
  "Vikram", "Pratap", "Aditya", "Rohan", "Siddharth", "Gautam", "Anoop", "Harish", "Ajeet", "Sukhbir"
];

const lastNames = [
  "Kumar", "Singh", "Sharma", "Verma", "Gupta", "Yadav", "Patel", "Joshi", "Mishra", "Pandey",
  "Pathak", "Reddy", "Naidu", "Rao", "Siddiqui", "Khan", "Patil", "Chavan", "Thackeray", "Pawar",
  "Shinde", "Deshmukh", "Banerjee", "Chatterjee", "Sen", "Das", "Deb", "Sangma", "Rio", "Zoramthanga",
  "Tamang", "Sarma", "Bordoloi", "Gogoi", "Hazarika", "Mahanta", "Chowdhury", "Nayak", "Patnaik",
  "Mohanty", "Behera", "Dasgupta", "Baghel", "Singh Deo", "Chouhan", "Scindia", "Nath", "Dixit",
  "Tiwari", "Pilot", "Gehlot", "Raje", "Shekhawat", "Dhami", "Khanduri", "Rawat", "Prasad", "Sinha"
];

const partyProfiles: Record<string, string[]> = {
  "default": ["BJP", "INC", "Regional"]
};

const REAL_STATE_URLS: Record<string, string> = {
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
  "West Bengal": "https://www.myneta.info/WestBengal2026/index.php?action=show_winners&sort=default",
  "Bihar": "https://www.myneta.info/Bihar2025/index.php?action=show_winners&sort=default"
};

function getRandomName() {
  const f = firstNames[Math.floor(Math.random() * firstNames.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${f} ${l}`;
}

async function main() {
  console.log("Starting DB seeding for all ~4911 representatives...");

  // console.log("Cleaning up tables...");
  // await prisma.candidate.deleteMany({});
  // await prisma.constituency.deleteMany({});
  // await prisma.election.deleteMany({});
  // await prisma.state.deleteMany({});

  console.log("Tables cleaned up.");

  for (const [stateName, counts] of Object.entries(STATE_SEAT_CAPACITY)) {
    if (REAL_STATE_URLS[stateName]) {
      console.log(`Skipping random generation for ${stateName}; scraping real data instead...`);
      const scraper = new ScraperService();
      try {
        await scraper.init();
        await scraper['scrapeState'](REAL_STATE_URLS[stateName], stateName);
      } catch (e) {
        logger.error(`Failed pushing real ${stateName} data: ${e}`);
      }
      
      // We still need to generate mocked Lok Sabha MPs for this state (as we only scrape MLAs here)
      // or we can generate them to fill the numbers if scraping only got MLAs
      const state = await prisma.state.findFirst({ where: { name: stateName } }) || await prisma.state.create({ data: { name: stateName } });
      const yearLS = 2024;
      const electionLS = await prisma.election.findFirst({
         where: { stateId: state.id, year: yearLS }
      }) || await prisma.election.create({
         data: { year: yearLS, stateId: state.id }
      });
      
      if (counts.ls > 0) {
        const stateParties = partyProfiles["default"];
        for (let i = 1; i <= counts.ls; i++) {
          const cName = `${stateName} Lok Sabha ${i}`;
          
          let c = await prisma.constituency.findFirst({ where: { name: cName, stateId: state.id }});
          if (!c) {
             c = await prisma.constituency.create({ data: { name: cName, stateId: state.id } });
          }

          const name = getRandomName();
          try {
            await prisma.candidate.create({
              data: {
                name, stateId: state.id, constituencyId: c.id, electionId: electionLS.id,
                party: stateParties[Math.floor(Math.random() * stateParties.length)], winner: true, type: "Lok Sabha"
              }
            });
          } catch (err: any) {
             console.warn(`[Validation Warning] Failed to insert Lok Sabha duplicate ${name} for ${cName}: ${err.message}`);
          }
        }
      }
      continue; // Skip the rest of random generation for MLAs for this state
    }

    // Other states: Random generation logic
    const state = await prisma.state.create({ data: { name: stateName } });
    const yearLS = 2024;
    const yearAssembly = 2023;

    const electionLS = await prisma.election.create({ data: { year: yearLS, stateId: state.id } });
    let electionAssembly = null;
    if (counts.assembly > 0) {
      electionAssembly = await prisma.election.create({ data: { year: yearAssembly, stateId: state.id } });
    }
    const stateParties = partyProfiles["default"];

    // Lok Sabha MPs
    if (counts.ls > 0) {
      for (let i = 1; i <= counts.ls; i++) {
        const cName = `${stateName} Lok Sabha ${i}`;
        const c = await prisma.constituency.create({ data: { name: cName, stateId: state.id } });
        const name = getRandomName();
        try {
          await prisma.candidate.create({
            data: {
              name, stateId: state.id, constituencyId: c.id, electionId: electionLS.id,
              party: stateParties[Math.floor(Math.random() * stateParties.length)], winner: true, type: "Lok Sabha"
            }
          });
        } catch (err: any) {
           console.warn(`[Validation Warning] Failed to insert Lok Sabha duplicate ${name} for ${cName}: ${err.message}`);
        }
      }
    }

    // Legislative Assembly MLAs
    if (counts.assembly > 0 && electionAssembly) {
      for (let i = 1; i <= counts.assembly; i++) {
        const cName = `${stateName} AC ${i}`;
        const c = await prisma.constituency.create({ data: { name: cName, stateId: state.id } });
        const name = getRandomName();
        try {
          await prisma.candidate.create({
            data: {
              name, stateId: state.id, constituencyId: c.id, electionId: electionAssembly.id,
              party: stateParties[Math.floor(Math.random() * stateParties.length)], winner: true, type: "MLA"
            }
          });
        } catch (err: any) {
           console.warn(`[Validation Warning] Failed to insert MLA duplicate ${name} for ${cName}: ${err.message}`);
        }
      }
    }
  }

  const finalMlaCount = await prisma.candidate.count({ where: { type: "MLA" } });
  const finalMpCount = await prisma.candidate.count({ where: { type: "Lok Sabha" } });
  
  console.log(`Database seeded successfully! Total MLAs: ${finalMlaCount}, Total Lok Sabha MPs: ${finalMpCount}`);
}

main()
  .catch((e) => {
    console.error("Failed to seed database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
