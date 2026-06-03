import * as cheerio from "cheerio";

async function run() {
  const r = await fetch("https://www.myneta.info/uttarpradesh2022/index.php?action=show_winners&sort=default");
  const html = await r.text();
  const $ = cheerio.load(html);

  $('table').each((i, tbl) => {
    const rows = $(tbl).find('tr');
    const headerText = $(tbl).find('tr').first().text().replace(/\s+/g, ' ').trim();
    if (i === 4 || i === 5) {
       console.log(`Table ${i}: ${rows.length} rows`);
       console.log(`First row: ${$(rows[1]).text().replace(/\s+/g, ' ').trim()}`);
       console.log(`Last row: ${$(rows[rows.length-1]).text().replace(/\s+/g, ' ').trim()}`);
    }
  });
}
run();
