export type Role = 'admin' | 'treasurer' | 'member';
export type Gender = 'male' | 'female' | 'other';

export interface Member {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
  gender: Gender;
  role: Role;
  initials: string;
  color: string;
  fg: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  memberId: string;
  month: string;
  year: number;
  amount: number;
  paymentDate: string;
}

export interface Investment {
  id: string;
  name: string;
  description: string;
  type: string;
  manager: string;
  buyDate: string;
  maturityDate: string;
  buyRate: number;
  currentRate: number;
  units: number;
  status: string;
  notes: string;
}

export interface AppData {
  members: Member[];
  payments: Payment[];
  investments: Investment[];
  cashInBank: number;
  monthlyContribution: number;
  lastUpdated: string;
}
