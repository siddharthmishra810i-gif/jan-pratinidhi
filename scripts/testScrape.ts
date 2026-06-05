import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
    const { data } = await axios.get("https://prsindia.org/mptrack?page=0");
    const $ = cheerio.load(data);
    const rows = $(".views-row");
    if(rows.length > 0) {
        console.log("HTML:");
        console.log($(rows[0]).html());
    }
}
main().catch(console.error);
