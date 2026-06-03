export interface Representative {
  id?: string;
  name: string;
  party: string;
  type?: string;
  state: string;
  constituency?: string;
  winner?: boolean;
}

export interface PartyDominanceData {
  party: string;
  lokSabha: number;
  rajyaSabha: number;
  assembly: number;
  total: number;
}

export function calculatePartyDominance(representatives: Representative[]): PartyDominanceData[] {
  const partyMap: Record<string, { lokSabha: number; rajyaSabha: number; assembly: number }> = {};

  representatives.forEach((rep) => {
    let party = rep.party;
    if (!party) return;
    
    // Normalize Independent
    if (party.toLowerCase() === "ind") party = "Independent";

    if (!partyMap[party]) {
      partyMap[party] = { lokSabha: 0, rajyaSabha: 0, assembly: 0 };
    }

    const type = rep.type || "";
    // Infer Lok Sabha if type is missing but has constituency (based on the original code logic)
    const isLokSabha = type === "Lok Sabha" || (!type && rep.constituency && !type.includes("Rajya") && type !== "MLA");
    const isRajyaSabha = type === "Rajya Sabha" || (!type && !rep.constituency);
    const isMLA = type === "MLA";

    if (isMLA) {
      partyMap[party].assembly += 1;
    } else if (isRajyaSabha) {
      partyMap[party].rajyaSabha += 1;
    } else {
      partyMap[party].lokSabha += 1;
    }
  });

  const data: PartyDominanceData[] = Object.entries(partyMap).map(([party, counts]) => ({
    party,
    lokSabha: counts.lokSabha,
    rajyaSabha: counts.rajyaSabha,
    assembly: counts.assembly,
    total: counts.lokSabha + counts.rajyaSabha + counts.assembly,
  }));

  // Sort by total descending
  return data.sort((a, b) => b.total - a.total);
}
