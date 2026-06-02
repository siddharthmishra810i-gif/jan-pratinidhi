import { parseRupees, parseNumber, cleanText } from './utils';

export interface ExtractedCandidateData {
  name: string;
  party: string;
  winner: boolean;
  gender: string | null;
  age: number | null;
  education: string | null;
  profession: string | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  criminalCasesCount: number;
  seriousCasesCount: number;
  panStatus: string | null;
  address: string | null;

  fatherName: string | null;
  motherName: string | null;
  spouseName: string | null;
  childrenInfo: string | null;
  email: string | null;
  mobileNumber: string | null;

  assets: {
    movableAssets: number;
    immovableAssets: number;
    cash: number;
    bankDeposits: number;
    vehicles: string | null;
    jewellery: number;
    agriculturalLand: number;
    commercialBuildings: number;
  } | null;

  liabilities: {
    bankLoans: number;
    governmentDues: number;
    taxDues: number;
    otherLiabilities: number;
  } | null;

  criminalCases: Array<{
    serious: boolean;
    ipcSections: string | null;
    courtInfo: string | null;
    description: string | null;
  }>;

  affidavitUrl: string | null;
}

export const extractCandidateDataFromProfile = async (page: any): Promise<Partial<ExtractedCandidateData>> => {
  const data: Partial<ExtractedCandidateData> = {};

  try {
    // Using Playwright's locator and evaluation strategies
    // 1. Basic Info table
    const pairs = await page.evaluate(() => {
      const results: Record<string, string> = {};
      
      // Look for standard labels in the DOM
      const textNodes = document.body.innerText.split('\n');
      let currentLabel = '';
      
      for (const line of textNodes) {
        const t = line.trim();
        if (!t) continue;
        
        if (t.includes(':')) {
           const [label, val] = t.split(/:(.*)/s);
           results[label.trim().toLowerCase()] = (val || '').trim();
        }
      }
      return results;
    });

    data.fatherName = cleanText(pairs["father's name"] || pairs["father name"] || pairs["husband's name"]);
    data.age = parseNumber(pairs["age"]);
    data.address = cleanText(pairs["address"]);
    data.email = cleanText(pairs["email"]);
    data.mobileNumber = cleanText(pairs["contact number"] || pairs["mobile"]);
    data.profession = cleanText(pairs["profession"]);
    
    // Check if winner
    const isWinner = await page.locator('.winner').count() > 0;
    data.winner = isWinner;

    // Extract Assets overview from DOM tables easily
    const assetsText = await page.locator('text=Total Assets').first().innerText().catch(() => '');
    data.totalAssets = parseRupees(assetsText);
    
    const liabilitiesText = await page.locator('text=Total Liabilities').first().innerText().catch(() => '');
    data.totalLiabilities = parseRupees(liabilitiesText);
    
    // Detailed Assets
    data.assets = {
       movableAssets: 0,
       immovableAssets: 0,
       cash: 0,
       bankDeposits: 0,
       vehicles: null,
       jewellery: 0,
       agriculturalLand: 0,
       commercialBuildings: 0
    };
    
    data.liabilities = {
       bankLoans: 0,
       governmentDues: 0,
       taxDues: 0,
       otherLiabilities: 0
    };

    data.criminalCases = [];
    
    // PDF Link
    const pdfHref = await page.locator('text="Download Complete Affidavit"').getAttribute('href').catch(() => null);
    if (pdfHref) {
      data.affidavitUrl = new URL(pdfHref, page.url()).href;
    }
    
  } catch (err) {
    // We ignore strict failures in parsing a specific field
  }

  return data;
};
