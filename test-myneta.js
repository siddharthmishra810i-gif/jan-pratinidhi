const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
  const { data } = await axios.get('https://www.myneta.info/state_assembly.php?state=Andhra%20Pradesh');
  const $ = cheerio.load(data);
  console.log("Title: ", $('title').text());
  
  // Find tables
  console.log("Tables:", $('table').length);
  $('table').each((i, el) => {
      console.log(`Table ${i} text snippet:`, $(el).text().substring(0, 100).replace(/\s+/g, ' '));
  });

  // Let's see rows of table 1 or 2
  $('table').eq(2).find('tr').slice(0, 3).each((i, el) => {
     console.log("Row", i, $(el).text().replace(/\s+/g, ' '));
  });
}
test();
