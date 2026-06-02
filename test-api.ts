import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/states/analytics');
    console.log(JSON.stringify(res.data).substring(0, 500));
  } catch (e) {
    console.error(e.message);
  }
}
test();
