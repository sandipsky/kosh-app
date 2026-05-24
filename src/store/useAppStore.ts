import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { AppData, Investment, Member, Payment } from '../types';
import { SEED_DATA } from '../constants/seed';
import { storage } from '../lib/storage';

interface AppState {
  data: AppData;
  hydrated: boolean;
  saving: boolean;
  hydrate: () => Promise<void>;
  resetToSeed: () => Promise<void>;

  upsertMember: (member: Omit<Member, 'id' | 'createdAt'> & { id?: string }) => Promise<Member>;
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

const cloneSeed = (): AppData =>
  JSON.parse(JSON.stringify(SEED_DATA)) as AppData;

async function persist(data: AppData): Promise<AppData> {
  const stamped: AppData = { ...data, lastUpdated: new Date().toISOString() };
  await storage.save(stamped);
  return stamped;
}

export const useAppStore = create<AppState>((set, get) => ({
  data: cloneSeed(),
  hydrated: false,
  saving: false,

  async hydrate() {
    const loaded = await storage.load();
    if (loaded) {
      set({ data: loaded, hydrated: true });
    } else {
      const seeded = await persist(cloneSeed());
      set({ data: seeded, hydrated: true });
    }
  },

  async resetToSeed() {
    const seeded = await persist(cloneSeed());
    set({ data: seeded });
  },

  async upsertMember(member) {
    const { data } = get();
    set({ saving: true });
    let result: Member;
    let next: AppData;
    if (member.id && data.members.some((m) => m.id === member.id)) {
      result = {
        ...(data.members.find((m) => m.id === member.id) as Member),
        ...member,
      } as Member;
      next = {
        ...data,
        members: data.members.map((m) => (m.id === result.id ? result : m)),
      };
    } else {
      result = {
        ...(member as Omit<Member, 'id' | 'createdAt'>),
        id: member.id ?? uuid(),
        createdAt: new Date().toISOString(),
      };
      next = { ...data, members: [...data.members, result] };
    }
    const saved = await persist(next);
    set({ data: saved, saving: false });
    return result;
  },

  async deleteMember(id) {
    const { data } = get();
    set({ saving: true });
    const next: AppData = {
      ...data,
      members: data.members.filter((m) => m.id !== id),
      payments: data.payments.filter((p) => p.memberId !== id),
    };
    const saved = await persist(next);
    set({ data: saved, saving: false });
  },

  async addPayment(payment) {
    const { data } = get();
    const dup = data.payments.find(
      (p) => p.memberId === payment.memberId && p.month === payment.month
    );
    if (dup) return null;
    set({ saving: true });
    const created: Payment = { ...payment, id: uuid() };
    const next: AppData = { ...data, payments: [...data.payments, created] };
    const saved = await persist(next);
    set({ data: saved, saving: false });
    return created;
  },

  async updatePayment(id, patch) {
    const { data } = get();
    set({ saving: true });
    const next: AppData = {
      ...data,
      payments: data.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    };
    const saved = await persist(next);
    set({ data: saved, saving: false });
  },

  async deletePayment(id) {
    const { data } = get();
    set({ saving: true });
    const next: AppData = {
      ...data,
      payments: data.payments.filter((p) => p.id !== id),
    };
    const saved = await persist(next);
    set({ data: saved, saving: false });
  },

  async upsertInvestment(inv) {
    const { data } = get();
    set({ saving: true });
    let result: Investment;
    let next: AppData;
    if (inv.id && data.investments.some((i) => i.id === inv.id)) {
      result = {
        ...(data.investments.find((i) => i.id === inv.id) as Investment),
        ...inv,
      } as Investment;
      next = {
        ...data,
        investments: data.investments.map((i) => (i.id === result.id ? result : i)),
      };
    } else {
      result = { ...(inv as Omit<Investment, 'id'>), id: inv.id ?? uuid() };
      next = { ...data, investments: [...data.investments, result] };
    }
    const saved = await persist(next);
    set({ data: saved, saving: false });
    return result;
  },

  async deleteInvestment(id) {
    const { data } = get();
    set({ saving: true });
    const next: AppData = {
      ...data,
      investments: data.investments.filter((i) => i.id !== id),
    };
    const saved = await persist(next);
    set({ data: saved, saving: false });
  },

  async setCashInBank(n) {
    const { data } = get();
    set({ saving: true });
    const saved = await persist({ ...data, cashInBank: n });
    set({ data: saved, saving: false });
  },

  async setInvestmentRate(id, rate) {
    const { data } = get();
    set({ saving: true });
    const next: AppData = {
      ...data,
      investments: data.investments.map((i) =>
        i.id === id ? { ...i, currentRate: rate } : i
      ),
    };
    const saved = await persist(next);
    set({ data: saved, saving: false });
  },

  async setMonthlyContribution(n) {
    const { data } = get();
    set({ saving: true });
    const saved = await persist({ ...data, monthlyContribution: n });
    set({ data: saved, saving: false });
  },
}));
