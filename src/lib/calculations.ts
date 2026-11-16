import type { AppData, Investment, Loan, LoanRepayment, Member } from '../types';
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

export interface LoanLedgerRow {
  repayment: LoanRepayment;
  /** Interest that accrued between the previous repayment (or issue) and this one. */
  interestAccrued: number;
  toInterest: number;
  toPrincipal: number;
  principalAfter: number;
  /** Outstanding principal + unpaid interest right after this repayment. */
  balanceAfter: number;
}

export interface LoanSummary {
  /** Recorded repayments in date order, with how each one was applied. */
  rows: LoanLedgerRow[];
  /** Cash received back — recorded installments, plus the final settlement for repaid loans. */
  totalRepaid: number;
  principalRepaid: number;
  interestPaid: number;
  /** Active: principal still owed. Defaulted: principal lost. Repaid: 0. */
  principalOutstanding: number;
  /** Interest accrued but not yet paid (active loans only). */
  interestDue: number;
  /** What the borrower owes today (active loans only). */
  balanceDue: number;
  /** All interest on the loan: paid + accrued-unpaid. */
  totalInterest: number;
}

function isoMs(iso: string): number {
  return new Date(iso).getTime();
}

function sortedRepayments(loan: Loan): LoanRepayment[] {
  return [...(loan.repayments ?? [])].sort(
    (a, b) => isoMs(a.date) - isoMs(b.date)
  );
}

/**
 * Walks a loan's repayments in date order. Simple annual interest accrues
 * daily on the outstanding principal only (unpaid interest never earns
 * interest). Each repayment clears accrued interest first, then principal.
 *
 * Closed loans stop accruing at their settle date:
 *  - repaid    → whatever was still owed is treated as paid at settlement
 *  - defaulted → remaining principal is lost, unpaid interest written off
 */
export function loanSummary(loan: Loan, asOf: Date = new Date()): LoanSummary {
  const rate = (Number(loan.interestRate) || 0) / 100;
  const principal = Number(loan.principal) || 0;
  const startMs = isoMs(loan.issueDate);
  const closed = loan.status !== 'active' && !!loan.settledDate;
  const endMs = closed ? isoMs(loan.settledDate as string) : asOf.getTime();
  const valid = !Number.isNaN(startMs) && !Number.isNaN(endMs);

  const accrue = (p: number, fromMs: number, toMs: number) =>
    valid && toMs > fromMs ? p * rate * ((toMs - fromMs) / DAY_MS / 365) : 0;

  let principalOut = principal;
  let interestUnpaid = 0;
  let principalRepaid = 0;
  let interestPaid = 0;
  let totalRepaid = 0;
  let lastMs = startMs;
  const rows: LoanLedgerRow[] = [];

  for (const r of sortedRepayments(loan)) {
    // Clamp into [issue, end] so a mis-dated entry still counts as cash
    // received but never accrues negative or post-settlement interest.
    const t = Math.min(Math.max(isoMs(r.date) || lastMs, lastMs), endMs);
    const accrued = accrue(principalOut, lastMs, t);
    interestUnpaid += accrued;
    lastMs = Math.max(lastMs, t);

    const amount = Math.max(0, Number(r.amount) || 0);
    const toInterest = Math.min(amount, interestUnpaid);
    const toPrincipal = Math.min(amount - toInterest, principalOut);
    interestUnpaid -= toInterest;
    principalOut -= toPrincipal;
    interestPaid += toInterest;
    principalRepaid += toPrincipal;
    totalRepaid += toInterest + toPrincipal;

    rows.push({
      repayment: r,
      interestAccrued: accrued,
      toInterest,
      toPrincipal,
      principalAfter: principalOut,
      balanceAfter: principalOut + interestUnpaid,
    });
  }

  interestUnpaid += accrue(principalOut, lastMs, endMs);

  if (loan.status === 'repaid') {
    // Final settlement: the remaining balance was paid off.
    totalRepaid += principalOut + interestUnpaid;
    principalRepaid += principalOut;
    interestPaid += interestUnpaid;
    principalOut = 0;
    interestUnpaid = 0;
  } else if (loan.status === 'defaulted') {
    interestUnpaid = 0; // written off along with the remaining principal
  }

  const active = loan.status === 'active';
  return {
    rows,
    totalRepaid,
    principalRepaid,
    interestPaid,
    principalOutstanding: principalOut,
    interestDue: active ? interestUnpaid : 0,
    balanceDue: active ? principalOut + interestUnpaid : 0,
    totalInterest: interestPaid + (active ? interestUnpaid : 0),
  };
}

/**
 * All interest on a loan: paid so far plus accrued-unpaid. For a defaulted
 * loan only the interest actually collected before the default counts.
 */
export function loanInterest(loan: Loan, asOf: Date = new Date()): number {
  return loanSummary(loan, asOf).totalInterest;
}

export function activeLoans(data: AppData): Loan[] {
  return data.loans.filter((l) => l.status === 'active');
}

/** Principal currently lent out and not yet repaid (active loans). */
export function loansOutstandingPrincipal(data: AppData): number {
  return activeLoans(data).reduce(
    (s, l) => s + loanSummary(l).principalOutstanding,
    0
  );
}

/** Principal lost to defaults — money that will never come back. */
export function loansDefaultedPrincipal(data: AppData): number {
  return data.loans
    .filter((l) => l.status === 'defaulted')
    .reduce((s, l) => s + loanSummary(l).principalOutstanding, 0);
}

/**
 * Realized interest income: interest collected on every loan — installments
 * on active loans, interest paid before a default, and everything on repaid
 * loans.
 */
export function loansInterestEarned(data: AppData): number {
  return data.loans.reduce((s, l) => s + loanSummary(l).interestPaid, 0);
}

/**
 * Value of active loans as a fund asset: outstanding principal plus the
 * unpaid interest accrued on it to date.
 */
export function loansReceivable(data: AppData): number {
  return activeLoans(data).reduce((s, l) => s + loanSummary(l).balanceDue, 0);
}

// ----- Monthly repayment plan ---------------------------------------------

export interface InstallmentRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  /** Principal + carried interest still owed after this installment. */
  balance: number;
}

/**
 * Simulates `months` equal monthly payments using the same rules as the loan
 * ledger: interest accrues on principal only (annual rate / 12 per month) and
 * each payment clears unpaid interest before principal. `interestDue` is
 * interest already accrued but unpaid — it is carried without earning interest.
 */
function simulatePlan(
  principal: number,
  interestDue: number,
  annualRatePct: number,
  months: number,
  payment: number
): { rows: InstallmentRow[]; residual: number } {
  const r = annualRatePct / 100 / 12;
  let p = principal;
  let u = interestDue;
  const rows: InstallmentRow[] = [];
  for (let m = 1; m <= months; m++) {
    const accrued = p * r;
    u += accrued;
    // The final installment clears whatever is left exactly.
    const pay = m === months ? Math.max(0, p + u) : payment;
    const toInterest = Math.min(pay, u);
    const toPrincipal = Math.min(pay - toInterest, p);
    u -= toInterest;
    p -= toPrincipal;
    rows.push({
      month: m,
      payment: toInterest + toPrincipal,
      interest: accrued,
      principal: toPrincipal,
      balance: p + u,
    });
  }
  return { rows, residual: p + u };
}

/**
 * Equal monthly installment needed to clear `principal` + `interestDue` in
 * `months` payments, with the full schedule. With nothing carried this is the
 * standard EMI formula; a binary search keeps it exact when there is
 * carried interest.
 */
export function installmentPlan(
  principal: number,
  interestDue: number,
  annualRatePct: number,
  months: number
): { payment: number; rows: InstallmentRow[]; totalInterest: number } {
  const n = Math.floor(months);
  const p = Math.max(0, principal);
  const u = Math.max(0, interestDue);
  if (n <= 0 || p + u <= 0) return { payment: 0, rows: [], totalInterest: 0 };

  const r = Math.max(0, annualRatePct) / 100 / 12;
  let lo = 0;
  // Paying everything plus a full term of interest in month one always clears it.
  let hi = p + u + p * r * n + 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const { rows } = simulatePlan(p, u, annualRatePct, n, mid);
    // Compare the forced final payment against the regular one.
    const last = rows[rows.length - 1]?.payment ?? 0;
    if (last > mid) lo = mid;
    else hi = mid;
  }
  const payment = hi;
  const { rows } = simulatePlan(p, u, annualRatePct, n, payment);
  const totalPaid = rows.reduce((s, row) => s + row.payment, 0);
  return { payment, rows, totalInterest: totalPaid - p };
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
