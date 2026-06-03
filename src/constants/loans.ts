import type { BorrowerType, LoanStatus } from '../types';

// Default annual interest rates. Overridable per loan in the form.
export const DEFAULT_INTEREST_RATE: Record<BorrowerType, number> = {
  member: 5,
  outside: 8,
};

export const BORROWER_TYPE_LABELS: Record<BorrowerType, string> = {
  member: 'Member',
  outside: 'Outside party',
};

export const BORROWER_TYPE_OPTIONS = (
  Object.keys(BORROWER_TYPE_LABELS) as BorrowerType[]
).map((value) => ({ value, label: BORROWER_TYPE_LABELS[value] }));

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  active: 'Active',
  repaid: 'Repaid',
  defaulted: 'Defaulted',
};

export const LOAN_STATUS_OPTIONS = (
  Object.keys(LOAN_STATUS_LABELS) as LoanStatus[]
).map((value) => ({ value, label: LOAN_STATUS_LABELS[value] }));

export const LOAN_STATUS_COLORS: Record<LoanStatus, string> = {
  active: 'blue',
  repaid: 'teal',
  defaulted: 'red',
};
