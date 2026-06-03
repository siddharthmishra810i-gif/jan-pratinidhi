import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkLokSabha() {
    const { data } = await axios.get('https://www.myneta.info/LokSabha2024/index.php?action=show_winners&sort=default');
    const $ = cheerio.load(data);
    let rowCount = 0;
    $('table').each((i, tbl) => {
        const text = $(tbl).text().substring(0, 100).replace(/\s+/g, ' ').toLowerCase();
        if (text.includes('candidate') && text.includes('party')) {
            rowCount = $(tbl).find('tr').length;
            console.log(`Table ${i} has ${rowCount} rows`);
        }
    });
}
checkLokSabha().then(() => process.exit(0));
