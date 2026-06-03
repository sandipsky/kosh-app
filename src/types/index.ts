export type Role = 'admin' | 'treasurer' | 'member';
export type Gender = 'male' | 'female' | 'other';

export interface Member {
  id: string;
  name: string;
  username: string;
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
  // Optional receipt stored in Firebase Storage. `attachmentUrl` is the public
  // download URL; `attachmentPath` is the storage path used to delete the file.
  // The same file may be shared across the months created in one bulk payment.
  attachmentUrl?: string;
  attachmentPath?: string;
  attachmentName?: string;
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
  // Member ids who hold a share in this investment. Captured at the time the
  // investment is recorded, so members who join later don't get a retroactive
  // share. Undefined on legacy investments → treated as "all members".
  participantIds?: string[];
}

export type BorrowerType = 'member' | 'outside';
export type LoanStatus = 'active' | 'repaid' | 'defaulted';

export interface Loan {
  id: string;
  borrowerType: BorrowerType;
  // Set only when borrowerType === 'member'; references members/{uid}.
  borrowerId?: string;
  // Display name — the outside party's name, or the member's name (denormalized
  // so the loan still reads correctly if the member is later removed).
  borrowerName: string;
  principal: number;
  // Annual simple interest rate, in percent.
  interestRate: number;
  issueDate: string; // ISO 'YYYY-MM-DD'
  dueDate?: string; // ISO 'YYYY-MM-DD', optional
  // Date the loan was closed (repaid or written off). Used to stop interest
  // accruing. Set when status leaves 'active'.
  settledDate?: string;
  status: LoanStatus;
  notes: string;
}

export interface AppData {
  members: Member[];
  payments: Payment[];
  investments: Investment[];
  loans: Loan[];
  cashInBank: number;
  monthlyContribution: number;
  lastUpdated: string;
}
