export interface PlanItem {
  dot: string;
  name: string;
  detail: string;
  best?: boolean;
}

export interface PlanTier {
  icon: 'shield' | 'certificate' | 'chart' | 'rocket';
  iconBg: string;
  iconColor: string;
  title: string;
  riskTag: string;
  riskBg: string;
  riskFg: string;
  amount: string;
  pct: number;
  barColor: string;
  description: string;
  items: PlanItem[];
}

export const PLAN_TIERS: PlanTier[] = [
  {
    icon: 'shield',
    iconBg: '#E6F1FB',
    iconColor: '#0C447C',
    title: 'Tier 1 — Emergency reserve',
    riskTag: 'Very low risk',
    riskBg: '#E6F1FB',
    riskFg: '#0C447C',
    amount: 'Rs 12,000',
    pct: 19,
    barColor: '#378ADD',
    description:
      'Keep Rs 12,000 liquid at all times — covers 1.5 months if members go silent. Park in a savings account at any A-class commercial bank.',
    items: [],
  },
  {
    icon: 'certificate',
    iconBg: '#E1F5EE',
    iconColor: '#085041',
    title: 'Tier 2 — Fixed deposit',
    riskTag: 'Low risk',
    riskBg: '#E1F5EE',
    riskFg: '#085041',
    amount: 'Rs 22,000',
    pct: 34,
    barColor: '#1D9E75',
    description:
      "Lock Rs 22,000 in a 1-year FD. NIC Asia and NMB currently offer Nepal's highest rate of 6.6% p.a. — guaranteed Rs 1,452 interest after TDS.",
    items: [
      {
        dot: '#1D9E75',
        name: 'NIC Asia Bank',
        detail: '6.6% p.a. · Best rate in Nepal · Online via NIC Asia Mobile Banking',
        best: true,
      },
      {
        dot: '#378ADD',
        name: 'NMB Bank',
        detail: '6.6% p.a. · Equal best · Good branch network',
      },
      {
        dot: '#888780',
        name: 'Nepal Investment Mega Bank',
        detail: '6.5% p.a. · 200+ branches, widely accessible',
      },
    ],
  },
  {
    icon: 'chart',
    iconBg: '#EEEDFE',
    iconColor: '#3C3489',
    title: 'Tier 3 — Mutual fund SIP',
    riskTag: 'Moderate risk',
    riskBg: '#EEEDFE',
    riskFg: '#3C3489',
    amount: 'Rs 2,000/month',
    pct: 38,
    barColor: '#7F77DD',
    description:
      'Put Rs 2,000/month from future collections into SIP. Over 2 years at 13–14% CAGR you can turn Rs 48,000 into ~Rs 55,000+. Open via MeroShare.',
    items: [
      {
        dot: '#534AB7',
        name: 'NIBL Samriddhi Fund 2',
        detail: '14.2% 3-yr CAGR · Top pick · Annual 5–6% dividend · NIBL Ace Capital',
        best: true,
      },
      {
        dot: '#378ADD',
        name: 'NIC Asia Growth Fund',
        detail: '13.8% CAGR · Balanced · Lower volatility · Good for students',
      },
      {
        dot: '#1D9E75',
        name: 'Sanima Balanced Fund',
        detail: '12.5% CAGR · Safest option · Semi-annual dividend',
      },
    ],
  },
  {
    icon: 'rocket',
    iconBg: '#FAEEDA',
    iconColor: '#633806',
    title: 'Tier 4 — IPO reserve',
    riskTag: 'Moderate risk',
    riskBg: '#FAEEDA',
    riskFg: '#633806',
    amount: 'Rs 30,000',
    pct: 47,
    barColor: '#EF9F27',
    description:
      "Keep Rs 30,000 ready for IPOs. Apply in all 6 members' names separately via MeroShare — 6× more allotment chances. Watch for hydropower IPOs in particular.",
    items: [
      {
        dot: '#EF9F27',
        name: 'Pro tip',
        detail:
          'Each member applies Rs 2,000–5,000 individually. Pool all allotted shares into fund records.',
      },
    ],
  },
];

export const FD_RATES: {
  bank: string;
  rate: string;
  class: string;
  best?: boolean;
  high?: boolean;
}[] = [
  { bank: 'NIC Asia Bank', rate: '6.6%', class: 'A', best: true },
  { bank: 'NMB Bank', rate: '6.6%', class: 'A', best: true },
  { bank: 'Nepal Inv. Mega Bank', rate: '6.5%', class: 'A' },
  { bank: 'Nabil Bank', rate: '6.0–6.5%', class: 'A' },
  { bank: 'Sanima Bank', rate: '6.0–6.5%', class: 'A' },
  { bank: 'Sunrise Bank', rate: '5.5–6.0%', class: 'A' },
  { bank: 'Other commercial banks', rate: '5.0–6.0%', class: 'A' },
  { bank: 'Development banks (B class)', rate: 'up to 7.5%', class: 'B', high: true },
];

export const MUTUAL_FUNDS = [
  {
    r: 1,
    n: 'NIBL Samriddhi Fund 2',
    a: 'NIBL Ace Capital',
    c: '14.2%',
    ri: 'Moderate',
    d: '5–6% annual',
    pick: true,
    w: 'Best 3-yr CAGR in Nepal. Top pick for student SIP. Open via MeroShare.',
  },
  {
    r: 2,
    n: 'NIC Asia Growth Fund',
    a: 'NIC Asia Capital',
    c: '13.8%',
    ri: 'Moderate',
    d: '4–5% annual',
    pick: true,
    w: 'Balanced fund, lower volatility. Good for students new to equity market.',
  },
  {
    r: 3,
    n: 'Siddhartha Equity Fund',
    a: 'Siddhartha Capital',
    c: '13.0%',
    ri: 'High',
    d: '6% annual',
    pick: false,
    w: 'Highest dividend but more volatile. Only during NEPSE bull runs.',
  },
  {
    r: 4,
    n: 'Sanima Balanced Fund',
    a: 'Sanima Capital',
    c: '12.5%',
    ri: 'Low-Moderate',
    d: '3% semi-annual',
    pick: true,
    w: 'Safest option. Semi-annual dividend good for cash flow.',
  },
  {
    r: 5,
    n: 'NMB Sulav Fund',
    a: 'NMB Capital',
    c: '11.9%',
    ri: 'Moderate',
    d: '4% annual',
    pick: false,
    w: 'Solid performer, lower entry barrier.',
  },
];

export const MILESTONES = [
  'Jestha 2083 — Open FD at NIC Asia / NMB with Rs 22,000',
  'Ashar 2083 — Start NIBL Samriddhi SIP at Rs 2,000/month',
  'Every IPO — All 6 members apply individually via MeroShare',
  'Mangsir 2085 — SOHL lock-in expires, evaluate sell vs hold',
  'Recover pending dues from members ASAP',
];
