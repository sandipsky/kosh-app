import type { AppData, Investment, Member } from '../types';
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

export function totalInvestmentsValue(data: AppData): number {
  return data.investments.reduce((s, i) => s + investmentCurrentValue(i), 0);
}

export function totalInvestmentsInvested(data: AppData): number {
  return data.investments.reduce((s, i) => s + investmentInvested(i), 0);
}

/**
 * Cash sitting in the kosh bank account = everything collected minus what
 * was already deployed into investments (at buy rates).
 * Derived live from contributions + investments — not stored.
 */
export function cashInBank(data: AppData): number {
  return totalContrib(data) - totalInvestmentsInvested(data);
}

export function totalFund(data: AppData): number {
  return cashInBank(data) + totalInvestmentsValue(data);
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
