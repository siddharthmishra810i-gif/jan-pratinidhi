import { rawHtmlData } from './rawHtml';

export interface Representative {
  id: string;
  name: string;
  party: string;
  constituency: string;
  state: string;
  status: string;
  terms: string;
  type: string;
  image?: string;
}

export const getRepresentatives = (): Representative[] => {
  if (typeof document === 'undefined') {
    return []; // For SSR or initial load before hydration if needed
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<table>${rawHtmlData}</table>`, 'text/html');
  const rows = doc.querySelectorAll('tr');
  const reps: Representative[] = [];

  // Skip the header row (i = 1)
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].querySelectorAll('td');
    if (cols.length >= 6) {
      const name = cols[0].textContent?.trim() || '';
      const party = cols[1].textContent?.trim() || '';
      const constituency = cols[2].textContent?.trim() || '';
      const state = cols[3].textContent?.trim() || '';
      const status = cols[4].textContent?.trim() || '';
      const terms = cols[5].textContent?.trim() || '';
      
      const id = encodeURIComponent((name + '-' + constituency).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      
      reps.push({
        id,
        name,
        party,
        constituency,
        state,
        status,
        terms,
        type: 'MP',
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=000000&textColor=ffffff`
      });
    }
  }

  return reps;
};

export const representativesData = getRepresentatives();
