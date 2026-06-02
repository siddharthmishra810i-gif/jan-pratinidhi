import axios from 'axios';
import * as cheerio from 'cheerio';
async function test() {
  const { data } = await axios.get('https://www.myneta.info/state_assembly.php?state=Andhra%20Pradesh');
  const $ = cheerio.load(data);
  // Get main links
  $('.item a').each((i, el) => {
    console.log($(el).text().trim(), $(el).attr('href'));
  });
  // Or check text in body
  console.log($('.div_margin').text().substring(0, 500));
}
test();
