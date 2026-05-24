import type { AppData, Member, Payment } from '../types';

const MEMBERS_RAW: Omit<Member, 'createdAt'>[] = [
  {
    id: 'admin',
    name: 'Administrator',
    username: 'admin',
    password: 'admin123',
    email: 'admin@kosh.local',
    gender: 'other',
    role: 'admin',
    initials: 'AD',
    color: '#EEEDFE',
    fg: '#3C3489',
  },
  {
    id: 'aman',
    name: 'Aman',
    username: 'aman',
    password: 'aman123',
    email: 'aman@kosh.local',
    gender: 'male',
    role: 'member',
    initials: 'AM',
    color: '#FAEEDA',
    fg: '#633806',
  },
  {
    id: 'anish',
    name: 'Anish',
    username: 'anish',
    password: 'anish123',
    email: 'anish@kosh.local',
    gender: 'male',
    role: 'treasurer',
    initials: 'AN',
    color: '#E6F1FB',
    fg: '#0C447C',
  },
  {
    id: 'isha',
    name: 'Isha',
    username: 'isha',
    password: 'isha123',
    email: 'isha@kosh.local',
    gender: 'female',
    role: 'member',
    initials: 'IS',
    color: '#E1F5EE',
    fg: '#085041',
  },
  {
    id: 'sajit',
    name: 'Sajit',
    username: 'sajit',
    password: 'sajit123',
    email: 'sajit@kosh.local',
    gender: 'male',
    role: 'member',
    initials: 'SA',
    color: '#E6F1FB',
    fg: '#0C447C',
  },
  {
    id: 'sandip',
    name: 'Sandip',
    username: 'sandip',
    password: 'sandip123',
    email: 'sandip@kosh.local',
    gender: 'male',
    role: 'member',
    initials: 'SP',
    color: '#FAEEDA',
    fg: '#633806',
  },
  {
    id: 'yadav',
    name: 'Yadav',
    username: 'yadav',
    password: 'yadav123',
    email: 'yadav@kosh.local',
    gender: 'male',
    role: 'member',
    initials: 'YA',
    color: '#E1F5EE',
    fg: '#085041',
  },
];

const PAYMENT_TUPLES: [string, string][] = [];

const FULL_MONTHS = ['Ashoj 2082', 'Kartik 2082', 'Mangsir 2082', 'Poush 2082', 'Magh 2082'];
const CONTRIB_MEMBERS = ['aman', 'anish', 'isha', 'sajit', 'sandip', 'yadav'];
for (const month of FULL_MONTHS) {
  for (const id of CONTRIB_MEMBERS) {
    PAYMENT_TUPLES.push([id, month]);
  }
}

for (const id of ['isha', 'sajit', 'yadav']) PAYMENT_TUPLES.push([id, 'Falgun 2082']);
for (const id of ['isha', 'yadav']) PAYMENT_TUPLES.push([id, 'Chaitra 2082']);
for (const id of ['isha', 'yadav']) PAYMENT_TUPLES.push([id, 'Baisakh 2083']);

function monthToBaseDate(month: string): string {
  const [, yearStr] = month.split(' ');
  const year = Number(yearStr);
  const adYear = year - 57;
  return `${adYear}-06-01T10:00:00.000Z`;
}

const PAYMENTS_SEED: Payment[] = PAYMENT_TUPLES.map(([memberId, month], i) => {
  const [, yearStr] = month.split(' ');
  return {
    id: `seed-pay-${i}`,
    memberId,
    month,
    year: Number(yearStr),
    amount: 2000,
    paymentDate: monthToBaseDate(month),
  };
});

const NOW = new Date().toISOString();

export const SEED_DATA: AppData = {
  members: MEMBERS_RAW.map((m) => ({ ...m, createdAt: NOW })),
  payments: PAYMENTS_SEED,
  investments: [
    {
      id: 'sohl-1',
      name: 'Solu Hydropower Ltd (SOHL)',
      description: 'Local IPO allotment — 100 units listed Chaitra 1, 2082.',
      type: 'Local IPO',
      manager: 'Anish',
      buyDate: 'Mangsir 2082',
      maturityDate: 'Mangsir 2085',
      buyRate: 100,
      currentRate: 691,
      units: 100,
      status: 'Allotted',
      notes: '100 units allotted. Listed Chaitra 1, 2082. Lock-in 3 yrs.',
    },
  ],
  cashInBank: 64000,
  monthlyContribution: 2000,
  lastUpdated: NOW,
};
