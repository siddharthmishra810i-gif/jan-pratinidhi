import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from './src/database/db';
import { parseRupees } from './src/parsers/utils';

async function fetchLokSabha() {
    try {
        console.log("Fetching Lok Sabha Winners...");
        const { data } = await axios.get('https://www.myneta.info/LokSabha2024/index.php?action=show_winners&sort=default', { timeout: 20000 });
        const $w = cheerio.load(data);
        
        const stateRecord = await prisma.state.upsert({
            where: { name: "National" },
            update: {},
            create: { name: "National" }
        });

        const electionRecord = await prisma.election.create({
            data: { year: 2024, stateId: stateRecord.id }
        }).catch(async () => {
            return await prisma.election.findFirst({ where: { stateId: stateRecord.id, year: 2024 } });
        });
        
        if (!electionRecord) return;

        const tables = $w('table').toArray();
        for (const tbl of tables) {
            const firstRowText = $w(tbl).find('tr').first().text().replace(/\s+/g, ' ').toLowerCase();
            if (firstRowText.includes('candidate') && firstRowText.includes('party')) {
                const rows = $w(tbl).find('tr').slice(1).toArray();
                console.log(`Processing table with ${rows.length} rows`);

                for (const row of rows) {
                    const cols = $w(row).find('td');
                    if (cols.length >= 7) {
                        const nameRaw = $w(cols[1]).text().trim();
                        const constituencyStr = $w(cols[2]).text().trim();
                        const partyStr = $w(cols[3]).text().trim();
                        const criminalRaw = parseInt($w(cols[4]).text().trim(), 10) || 0;
                        const educationStr = $w(cols[5]).text().trim();
                        const assetsStr = parseRupees($w(cols[6]).text().trim());
                        const liabilitiesStr = cols.length >= 8 ? parseRupees($w(cols[7]).text().trim()) : null;

                        if (!nameRaw || nameRaw === '0') continue;

                        const name = nameRaw.split('~')[0].trim();

                        let constituencyRecord = await prisma.constituency.findFirst({ where: { name: constituencyStr, stateId: stateRecord.id } });
                        if (!constituencyRecord) {
                            constituencyRecord = await prisma.constituency.create({
                                data: { name: constituencyStr, stateId: stateRecord.id }
                            });
                        }

                        if (!constituencyRecord) continue;

                        try {
                           await prisma.candidate.create({
                               data: {
                                   name,
                                   stateId: stateRecord.id,
                                   electionId: electionRecord.id,
                                   constituencyId: constituencyRecord.id,
                                   party: partyStr,
                                   winner: true,
                                   type: "Lok Sabha",
                                   education: educationStr,
                                   criminalCasesCount: criminalRaw,
                                   totalAssets: assetsStr,
                                   totalLiabilities: liabilitiesStr
                               }
                           });
                        } catch(e) {}
                    }
                }
            }
        }
        
        console.log("Done Lok Sabha!");

    } catch (e) {
        console.error(e);
    }
}
fetchLokSabha().then(() => process.exit(0));
