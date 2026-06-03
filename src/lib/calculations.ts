import type { AppData, Investment, Loan, Member } from '../types';
import {
  currentMonthLabel,
  KOSH_START_MONTH,
  MONTHS_ORDER,
  sortByMonth,
} from '../constants/months';
import { isBootstrapAdmin } from './firebase';

export function isContributingMember(member: Member): boolean {
  return !isBootstrapAdmin(member);
}

export function memberTotal(data: AppData, memberId: string): number {
  return data.payments
    .filter((p) => p.memberId === memberId)
    .reduce((s, p) => s + p.amount, 0);
}

export function totalContrib(data: AppData): number {
  return data.payments.reduce((s, p) => s + p.amount, 0);
}

export function investmentCurrentValue(inv: Investment): number {
  return inv.units * inv.currentRate;
}

export function investmentInvested(inv: Investment): number {
  return inv.units * inv.buyRate;
}

/**
 * The members who hold a share in an investment. A stored `participantIds`
 * list is authoritative; legacy investments without one are treated as shared
 * by all current contributing members.
 */
export function investmentParticipants(
  data: AppData,
  inv: Investment
): Member[] {
  const contributing = data.members.filter(isContributingMember);
  if (!inv.participantIds || inv.participantIds.length === 0) {
    return contributing;
  }
  const ids = new Set(inv.participantIds);
  return contributing.filter((m) => ids.has(m.id));
}

/** Invested amount (at buy rate) split evenly across the participants. */
export function investmentShare(participantCount: number, invested: number): number {
  if (participantCount <= 0) return 0;
  return invested / participantCount;
}

export function totalInvestmentsValue(data: AppData): number {
  return data.investments.reduce((s, i) => s + investmentCurrentValue(i), 0);
}

export function totalInvestmentsInvested(data: AppData): number {
  return data.investments.reduce((s, i) => s + investmentInvested(i), 0);
}

// ----- Loans -------------------------------------------------------------

const DAY_MS = 86_400_000;

/**
 * Days a loan has been (or was) outstanding. Counts from issue date to the
 * settle date if closed, otherwise to `asOf` (now). Never negative.
 */
export function loanDays(loan: Loan, asOf: Date = new Date()): number {
  const start = new Date(loan.issueDate).getTime();
  const end = (loan.settledDate ? new Date(loan.settledDate) : asOf).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, (end - start) / DAY_MS);
}

/**
 * Simple annual interest: principal × rate% × (days / 365).
 * Defaulted loans earn nothing — the interest is written off with the principal.
 */
export function loanInterest(loan: Loan, asOf: Date = new Date()): number {
  if (loan.status === 'defaulted') return 0;
  return loan.principal * (loan.interestRate / 100) * (loanDays(loan, asOf) / 365);
}

/** Principal + interest accrued so far (or at settlement). */
export function loanTotalDue(loan: Loan, asOf: Date = new Date()): number {
  return loan.principal + loanInterest(loan, asOf);
}

export function activeLoans(data: AppData): Loan[] {
  return data.loans.filter((l) => l.status === 'active');
}

/** Principal currently lent out and not yet repaid (active loans). */
export function loansOutstandingPrincipal(data: AppData): number {
  return activeLoans(data).reduce((s, l) => s + l.principal, 0);
}

/** Principal lost to defaults — money that will never come back. */
export function loansDefaultedPrincipal(data: AppData): number {
  return data.loans
    .filter((l) => l.status === 'defaulted')
    .reduce((s, l) => s + l.principal, 0);
}

/** Realized interest income from loans that have been fully repaid. */
export function loansInterestEarned(data: AppData): number {
  return data.loans
    .filter((l) => l.status === 'repaid')
    .reduce((s, l) => s + loanInterest(l), 0);
}

/**
 * Value of active loans as a fund asset: outstanding principal plus the
 * interest accrued on it to date.
 */
export function loansReceivable(data: AppData): number {
  return activeLoans(data).reduce((s, l) => s + loanTotalDue(l), 0);
}

// -------------------------------------------------------------------------

/**
 * Cash sitting in the kosh bank account = everything collected, minus what
 * was deployed into investments (at buy rates), minus principal currently out
 * on loan and principal lost to defaults, plus interest already collected on
 * repaid loans. Derived live — not stored.
 */
export function cashInBank(data: AppData): number {
  return (
    totalContrib(data) -
    totalInvestmentsInvested(data) -
    loansOutstandingPrincipal(data) -
    loansDefaultedPrincipal(data) +
    loansInterestEarned(data)
  );
}

export function totalFund(data: AppData): number {
  return cashInBank(data) + totalInvestmentsValue(data) + loansReceivable(data);
}

/**
 * All Nepali months from Ashoj 2082 (when the kosh started) up to and
 * including the current month. Used for dues + contributions grid.
 */
export function allKoshMonths(): string[] {
  const startIdx = MONTHS_ORDER.indexOf(KOSH_START_MONTH);
  const endIdx = MONTHS_ORDER.indexOf(currentMonthLabel());
  if (startIdx < 0) return [];
  if (endIdx < startIdx) return MONTHS_ORDER.slice(startIdx);
  return MONTHS_ORDER.slice(startIdx, endIdx + 1);
}

/**
 * Every month allowed in the payment form — Ashoj 2082 onwards (no upper
 * bound, includes future months so advance payments can be recorded).
 */
export function allPaymentMonths(): string[] {
  const startIdx = MONTHS_ORDER.indexOf(KOSH_START_MONTH);
  if (startIdx < 0) return [...MONTHS_ORDER];
  return MONTHS_ORDER.slice(startIdx);
}

export function uniqueMonths(data: AppData): string[] {
  return [...new Set(data.payments.map((p) => p.month))].sort(sortByMonth);
}

export function pendingDues(data: AppData): number {
  const months = allKoshMonths();
  const contribMembers = data.members.filter(isContributingMember);
  let due = 0;
  for (const m of contribMembers) {
    for (const month of months) {
      const exists = data.payments.find(
        (p) => p.memberId === m.id && p.month === month
      );
      if (!exists) due += data.monthlyContribution;
    }
  }
  return due;
}

export function memberDue(data: AppData, memberId: string): number {
  const member = data.members.find((m) => m.id === memberId);
  if (!member || !isContributingMember(member)) return 0;
  const months = allKoshMonths();
  const paid = data.payments
    .filter((p) => p.memberId === memberId)
    .map((p) => p.month);
  const pending = months.filter((mo) => !paid.includes(mo)).length;
  return pending * data.monthlyContribution;
}

export type MemberStatus = 'cleared' | 'behind';

export function memberStatus(data: AppData, memberId: string): MemberStatus {
  return memberDue(data, memberId) === 0 ? 'cleared' : 'behind';
}

export function recentPayments(data: AppData, limit = 8) {
  return [...data.payments]
    .sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    )
    .slice(0, limit);
}

export function findMember(data: AppData, id: string): Member | undefined {
  return data.members.find((m) => m.id === id);
}

export function monthlyTotals(data: AppData): { month: string; total: number }[] {
  const months = allKoshMonths();
  return months.map((mo) => ({
    month: mo,
    total: data.payments
      .filter((p) => p.month === mo)
      .reduce((s, p) => s + p.amount, 0),
  }));
}
