export const parseRupees = (value: string | null | undefined): number => {
  if (!value) return 0;
  // Remove formatting like commas and 'Rs' prefix
  const cleanStr = value.replace(/Rs\s*/i, '').replace(/,/g, '').replace(/~/g, '').trim();
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

export const parseNumber = (value: string | null | undefined): number => {
  if (!value) return 0;
  const num = parseInt(value.replace(/,/g, '').trim(), 10);
  return isNaN(num) ? 0 : num;
};

export const cleanText = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned === '' || cleaned.toLowerCase() === 'nil' || cleaned.toLowerCase() === 'none' ? null : cleaned;
};
