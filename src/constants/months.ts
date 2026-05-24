import NepaliDate from 'nepali-date-converter';

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

// Generous range so MONTHS_ORDER + dropdowns stay valid for years to come.
export const BS_YEARS = [
  2082, 2083, 2084, 2085, 2086, 2087, 2088, 2089, 2090, 2091, 2092, 2093, 2094, 2095,
] as const;

/**
 * Today's Nepali month name. Computed live via AD→BS conversion, so the value
 * updates as time passes (next call after a month-boundary returns the new month).
 */
export function currentNepaliMonth(): NepaliMonth {
  return NEPALI_MONTHS[new NepaliDate().getMonth()] as NepaliMonth;
}

/** Today's Nepali year (BS). Computed live. */
export function currentNepaliYear(): number {
  return new NepaliDate().getYear();
}

/** Today's "Jestha 2083"-style label. Computed live. */
export function currentMonthLabel(): string {
  return `${currentNepaliMonth()} ${currentNepaliYear()}`;
}

// Kosh started Ashoj 2082 — no payments allowed before this month.
export const KOSH_START_MONTH = 'Ashoj 2082';

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
