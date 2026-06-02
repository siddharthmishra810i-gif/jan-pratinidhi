import axios from 'axios';
import fs from 'fs';
async function test() {
  const { data } = await axios.get('https://www.myneta.info/state_assembly.php?state=Andhra%20Pradesh');
  fs.writeFileSync('myneta_ap.html', data);
}
test();
