export interface ParliamentaryQuestion {
  id: string;
  type: "Starred" | "Unstarred";
  ministry: string;
  subject: string;
  date: string;
}

const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const MINISTRIES = [
  "Ministry of Road Transport and Highways",
  "Ministry of Health and Family Welfare",
  "Ministry of Rural Development",
  "Ministry of Railways",
  "Ministry of Agriculture and Farmers Welfare",
  "Ministry of Education",
  "Ministry of Women and Child Development",
  "Ministry of Jal Shakti",
  "Ministry of Finance",
  "Ministry of Home Affairs",
  "Ministry of Defence"
];

const SUBJECTS_MAP: Record<string, string[]> = {
  "Ministry of Road Transport and Highways": ["Status of National Highway Expansion", "Funds for State Highway Repair", "Toll Plaza Automation", "Road Safety Measures"],
  "Ministry of Health and Family Welfare": ["Setup of New Medical Colleges", "Ayushman Bharat Beneficiaries", "Vaccination Drive Progress", "Upgradation of District Hospitals"],
  "Ministry of Rural Development": ["Implementation of MGNREGA", "PMGSY Road Construction", "Rural Housing Schemes", "Panchayat Development Funds"],
  "Ministry of Railways": ["Modernization of Railway Stations", "Introduction of New Vande Bharat Trains", "Railway Safety Automation (Kavach)", "Electrification of Routes"],
  "Ministry of Agriculture and Farmers Welfare": ["Subsidies for Farmers under PM-KISAN", "Crop Insurance Claim Settlement", "Fertilizer Availability", "Promotion of Organic Farming"],
  "Ministry of Education": ["Establishment of Kendriya Vidyalayas", "Higher Education Funding", "Digital Literacy Initiatives", "Mid-Day Meal Scheme Details"],
  "Ministry of Women and Child Development": ["Funds allocated for Anganwadi Centres", "Beti Bachao Beti Padhao Implementation", "Women Empowerment Schemes", "Child Malnutrition Eradication"],
  "Ministry of Jal Shakti": ["Progress of Jal Jeevan Mission", "River Interlinking Projects", "Groundwater Depletion Measures", "Irrigation Projects Status"],
  "Ministry of Finance": ["Credit Availability for MSMEs", "Inflation Control Measures", "Direct Tax Collection Details", "Banking Sector Reforms"],
  "Ministry of Home Affairs": ["Modernization of Police Forces", "Border Infrastructure Development", "Cyber Crime Prevention", "Disaster Relief Funds"],
  "Ministry of Defence": ["Border Road Construction", "Indigenization of Defense Manufacturing", "Welfare of Ex-Servicemen", "NCC Schools Expansion"]
};

const DATES = [
  "08 Aug 2024", "25 Jul 2024", "22 Jul 2024", "15 Jul 2024", "09 Feb 2024", "05 Feb 2024", "30 Jan 2024", "15 Dec 2023", "08 Dec 2023"
];

export const getQuestionsForMP = (id: string, name: string): ParliamentaryQuestion[] => {
  const hash = generateHash(id + name);
  
  // Decide how many questions this MP asked (between 0 and 6)
  const numQuestions = hash % 7;
  
  if (numQuestions === 0) return [];

  const questions: ParliamentaryQuestion[] = [];
  
  for (let i = 0; i < numQuestions; i++) {
    const qHash = generateHash(id + i.toString());
    const ministry = MINISTRIES[qHash % MINISTRIES.length];
    const subjects = SUBJECTS_MAP[ministry];
    const subject = subjects[(qHash >> 2) % subjects.length];
    
    questions.push({
      id: `Q-${qHash.toString(16).toUpperCase()}`,
      type: qHash % 4 === 0 ? "Starred" : "Unstarred", // Roughly 25% are Starred
      ministry,
      subject,
      date: DATES[(qHash >> 3) % DATES.length],
    });
  }

  // Sort descending by a mock date logic or just leave in order
  return questions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
