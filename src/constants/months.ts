export const NEPALI_MONTHS = [
  'Baisakh',
  'Jestha',
  'Ashar',
  'Shrawan',
  'Bhadau',
  'Ashoj',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

export type NepaliMonth = (typeof NEPALI_MONTHS)[number];

export const BS_YEARS = [2082, 2083, 2084, 2085, 2086] as const;

export const CURRENT_NEPALI_MONTH: NepaliMonth = 'Jestha';
export const CURRENT_NEPALI_YEAR = 2083;

export const MONTHS_ORDER: string[] = (() => {
  const out: string[] = [];
  for (const year of BS_YEARS) {
    for (const month of NEPALI_MONTHS) {
      out.push(`${month} ${year}`);
    }
  }
  return out;
})();

export function monthLabel(month: string, year: number): string {
  return `${month} ${year}`;
}

export function sortByMonth(a: string, b: string): number {
  return MONTHS_ORDER.indexOf(a) - MONTHS_ORDER.indexOf(b);
}
