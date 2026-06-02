import axios from 'axios';
import * as cheerio from 'cheerio';
async function test() {
  const { data } = await axios.get('https://www.myneta.info/state_assembly.php?state=Andhra%20Pradesh');
  const $ = cheerio.load(data);
  const firstWinnerLink = $('a:contains("Winners")').first().attr('href');
  console.log("Winner link:", firstWinnerLink);
  
  if (firstWinnerLink) {
    const winnerUrl = 'https://www.myneta.info' + firstWinnerLink;
    const { data: winnerData } = await axios.get(winnerUrl);
    const $w = cheerio.load(winnerData);
    
    $w('table').eq(2).find('tr').slice(1, 4).each((i, el) => {
       console.log("Winner", i, $w(el).text().replace(/\s+/g, ' '));
       // typically: Name, Constituency, Party, Criminal Cases, Education, Assets, Liabilities
    });
  }
}
test();
