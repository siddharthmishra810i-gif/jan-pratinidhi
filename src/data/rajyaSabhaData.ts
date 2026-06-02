import { rawRajyaSabhaHtml } from "./rawRajyaSabhaHtml";
import { Representative } from "./representatives";

export const getRajyaSabhaMembers = (): Representative[] => {
  const members: Representative[] = [];
  const rowRegex = /<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g;
  let match;
  let idCounter = 1;

  while ((match = rowRegex.exec(rawRajyaSabhaHtml)) !== null) {
      if (match[1].includes("Member Name")) continue;
      
      const nameRaw = match[1].replace(/<[^>]+>/g, '').trim();
      const party = match[2].replace(/<[^>]+>/g, '').trim();
      const state = match[3].replace(/<[^>]+>/g, '').trim();
      const termInfo = match[5].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
      
      members.push({
          id: `rs-${idCounter++}`,
          name: nameRaw,
          party: party,
          state: state,
          constituency: "Rajya Sabha",
          status: "Sitting Member",
          terms: termInfo,
          type: "Rajya Sabha",
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameRaw)}&background=random&color=fff`
      });
  }
  return members;
};

export const rajyaSabhaData = getRajyaSabhaMembers();
