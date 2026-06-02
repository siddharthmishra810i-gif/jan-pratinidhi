import axios from 'axios';
import * as cheerio from 'cheerio';
async function test() {
  const { data: winnerData } = await axios.get('https://www.myneta.info/AndhraPradesh2024/index.php?action=show_winners&sort=default');
  const $w = cheerio.load(winnerData);
  
  $w('table').each((tIdx, tbl) => {
    const firstRowText = $w(tbl).find('tr').first().text().replace(/\s+/g, ' ');
    if (firstRowText.toLowerCase().includes('candidate') && firstRowText.toLowerCase().includes('party')) {
      console.log(`Found candidate table at index ${tIdx}`);
      $w(tbl).find('tr').slice(1, 3).each((rIdx, row) => {
        const columns = $w(row).find('td');
        const vals = columns.map((i, c) => $w(c).text().trim().replace(/\s+/g, ' ')).get();
        console.log("Candidate row:", vals);
      });
    }
  });
}
test();
