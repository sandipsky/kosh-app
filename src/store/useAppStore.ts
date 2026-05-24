import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Unsubscribe } from 'firebase/firestore';
import type { AppData, Investment, Member, Payment } from '../types';
import { storage } from '../lib/storage';

interface AppState {
  data: AppData;
  hydrated: boolean;
  saving: boolean;
  error: string | null;

  hydrate: () => Unsubscribe;

  upsertMember: (member: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  addPayment: (payment: Omit<Payment, 'id'>) => Promise<Payment | null>;
  updatePayment: (id: string, patch: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  upsertInvestment: (
    inv: Omit<Investment, 'id'> & { id?: string }
  ) => Promise<Investment>;
  deleteInvestment: (id: string) => Promise<void>;

  setCashInBank: (n: number) => Promise<void>;
  setInvestmentRate: (id: string, rate: number) => Promise<void>;
  setMonthlyContribution: (n: number) => Promise<void>;
}

const EMPTY: AppData = {
  members: [],
  payments: [],
  investments: [],
  cashInBank: 0,
  monthlyContribution: 2000,
  lastUpdated: new Date().toISOString(),
};

async function withSaving<T>(
  set: (partial: Partial<AppState>) => void,
  fn: () => Promise<T>
): Promise<T> {
  set({ saving: true, error: null });
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    set({ error: msg });
    throw e;
  } finally {
    set({ saving: false });
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  data: EMPTY,
  hydrated: false,
  saving: false,
  error: null,

  hydrate() {
    return storage.subscribe((data) => {
      set({ data, hydrated: true });
    });
  },

  async upsertMember(member) {
    await withSaving(set, () => storage.saveMember(member));
  },

  async deleteMember(id) {
    const { data } = get();
    await withSaving(set, async () => {
      const memberPayments = data.payments.filter((p) => p.memberId === id);
      await Promise.all(memberPayments.map((p) => storage.deletePayment(p.id)));
      await storage.deleteMember(id);
    });
  },

  async addPayment(payment) {
    const { data } = get();
    const dup = data.payments.find(
      (p) => p.memberId === payment.memberId && p.month === payment.month
    );
    if (dup) return null;
    const created: Payment = { ...payment, id: uuid() };
    await withSaving(set, () => storage.savePayment(created));
    return created;
  },

  async updatePayment(id, patch) {
    const { data } = get();
    const existing = data.payments.find((p) => p.id === id);
    if (!existing) return;
    const updated: Payment = { ...existing, ...patch, id };
    await withSaving(set, () => storage.savePayment(updated));
  },

  async deletePayment(id) {
    await withSaving(set, () => storage.deletePayment(id));
  },

  async upsertInvestment(inv) {
    const id = inv.id ?? uuid();
    const result: Investment = { ...(inv as Omit<Investment, 'id'>), id };
    await withSaving(set, () => storage.saveInvestment(result));
    return result;
  },

  async deleteInvestment(id) {
    await withSaving(set, () => storage.deleteInvestment(id));
  },

  async setCashInBank(n) {
    await withSaving(set, () => storage.setCashInBank(n));
  },

  async setInvestmentRate(id, rate) {
    const { data } = get();
    const inv = data.investments.find((i) => i.id === id);
    if (!inv) return;
    await withSaving(set, () =>
      storage.saveInvestment({ ...inv, currentRate: rate })
    );
  },

  async setMonthlyContribution(n) {
    await withSaving(set, () => storage.setMonthlyContribution(n));
  },
}));
