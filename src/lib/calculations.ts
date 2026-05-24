import type { AppData, Investment, Member } from '../types';
import { sortByMonth } from '../constants/months';

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

export function totalFund(data: AppData): number {
  return data.cashInBank + totalInvestmentsValue(data);
}

export function uniqueMonths(data: AppData): string[] {
  return [...new Set(data.payments.map((p) => p.month))].sort(sortByMonth);
}

export function pendingDues(data: AppData): number {
  const months = uniqueMonths(data);
  const contribMembers = data.members.filter((m) => m.role !== 'admin');
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
  if (data.members.find((m) => m.id === memberId)?.role === 'admin') return 0;
  const months = uniqueMonths(data);
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
  const months = uniqueMonths(data);
  return months.map((mo) => ({
    month: mo,
    total: data.payments
      .filter((p) => p.month === mo)
      .reduce((s, p) => s + p.amount, 0),
  }));
}
