import axios from 'axios';
import * as cheerio from 'cheerio';
async function test() {
  const { data } = await axios.get('https://www.myneta.info/state_assembly.php?state=Andhra%20Pradesh');
  const $ = cheerio.load(data);
  console.log("Title: ", $('title').text());
  
  console.log("Tables:", $('table').length);
  $('table').each((i, el) => {
      console.log(`Table ${i} text snippet:`, $(el).text().substring(0, 50).replace(/\s+/g, ' '));
  });

  // Let's see rows of the table (likely table 2 or 3)
  $('table').each((tIdx, tbl) => {
      console.log('--- Table', tIdx, '---');
      $(tbl).find('tr').slice(0, 3).each((i, el) => {
         console.log("Row", i, $(el).text().replace(/\s+/g, ' '));
      });
  });
}
test();
