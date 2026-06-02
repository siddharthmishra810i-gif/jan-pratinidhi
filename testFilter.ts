import { representativesData } from './src/data/representatives';
import { rajyaSabhaData } from './src/data/rajyaSabhaData';

const query = 'Varanasi'.toLowerCase().trim();
const dataSource = [...representativesData, ...rajyaSabhaData];

const filtered = dataSource.filter((rep) => 
  (rep.name || "").toLowerCase().includes(query) ||
  (rep.constituency || "").toLowerCase().includes(query) ||
  (rep.party || "").toLowerCase().includes(query) ||
  (rep.state || "").toLowerCase().includes(query)
);

console.log("Found:", filtered.length, filtered.map(r => r.name));
