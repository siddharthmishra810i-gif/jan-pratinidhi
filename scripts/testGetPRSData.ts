import * as cheerio from "cheerio";
import axios from "axios";

async function run() {
  const r = await axios.get("https://prsindia.org/mlatrack?state=Himachal%20Pradesh");
  const html = r.data;
  const $ = cheerio.load(html);

  const mlaData = [];
  $('.views-row').each((i, el) => {
    const rawName = $(el).find('.views-field-title-field h3 a').text().trim();
    if (!rawName) return;
    
    const attElement = $(el).find('.views-field-field-attendance .field-content .fs-16');
    const attText = attElement.text().trim();

    if (i === 0) console.log($(el).html());
  });
}
run();
