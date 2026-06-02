export interface AffidavitData {
  criminalCases: number;
  totalAssets: string;
  liabilities: string;
  education: string;
  age: number;
  gender: string;
  guardianName: string;
  address: string;
  phone: string;
  maritalStatus: string;
  childrenDetails: string;
}

// Deterministic mock data generation based on string hash
const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Crores`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakhs`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

const educationLevels = [
  "10th Pass", "12th Pass", "Graduate", "Graduate Professional", "Post Graduate", "Doctorate", "Others"
];

const indianFirstNames = ["Ramesh", "Suresh", "Ram", "Bharat", "Abdul", "Mohammad", "Krishna", "Arjun", "Mahendra", "Hari", "Shiv", "Subhash", "Vijay", "Rajendra", "Prasad"];
const indianLastNames = ["Kumar", "Singh", "Yadav", "Patel", "Das", "Sharma", "Mishra", "Choudhary", "Reddy", "Rao", "Naidu", "Sen", "Gupta"];

const getGenderFromName = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("smt") || lower.includes("ms ") || lower.includes("sushri") || lower.includes("kumari")) return "Female";
  return "Male";
};

export const getAffidavitData = (id: string, name: string): AffidavitData => {
  const hash = generateHash(id);
  
  // Deterministic random numbers based on hash
  const casesValue = hash % 10; // 0 to 9 cases randomly
  const assetsValue = (hash % 500) * 1000000; // random assets up to 500 crores
  const liabilitiesValue = (hash % 100) * 1000000; // random liabilities up to 100 crores
  const eduIndex = hash % educationLevels.length;
  
  const age = 30 + (hash % 50); // Age between 30 and 79
  const gender = getGenderFromName(name);
  
  const parentFirst = indianFirstNames[hash % indianFirstNames.length];
  const parentLast = indianLastNames[(hash >> 2) % indianLastNames.length];
  const guardianName = `${parentFirst} ${parentLast}`;
  
  const addressNum = (hash % 1000) + 1;
  const address = `House No. ${addressNum}, Local Ward, Area District, State`;

  const phonePart1 = 9800000000 + (hash % 100000000);
  const phone = `+91 ${phonePart1}`;

  const maritalStatusArr = ["Married", "Unmarried", "Widow", "Divorced"];
  const maritalStatus = maritalStatusArr[hash % maritalStatusArr.length];

  let childrenCount = 0;
  if (maritalStatus === "Married") {
    childrenCount = hash % 4; // 0 to 3 children
  }
  const childrenDetails = childrenCount === 0 ? "No Children" : `${childrenCount} ${childrenCount === 1 ? 'Child' : 'Children'}`;

  return {
    criminalCases: casesValue > 5 ? 0 : casesValue, // Skew towards 0 cases
    totalAssets: formatCurrency(assetsValue + 5000000), // add base
    liabilities: formatCurrency(liabilitiesValue),
    education: educationLevels[eduIndex],
    age,
    gender,
    guardianName,
    address,
    phone,
    maritalStatus,
    childrenDetails,
  };
};
