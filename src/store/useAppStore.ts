import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Unsubscribe } from 'firebase/firestore';
import type { AppData, Investment, Loan, Member, Payment } from '../types';
import { storage } from '../lib/storage';
import type { Attachment } from '../lib/storage';

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

  uploadAttachment: (file: File) => Promise<Attachment>;
  removeAttachment: (paymentId: string) => Promise<void>;
  deleteAttachment: (path: string) => Promise<void>;

  upsertInvestment: (
    inv: Omit<Investment, 'id'> & { id?: string }
  ) => Promise<Investment>;
  deleteInvestment: (id: string) => Promise<void>;

  upsertLoan: (loan: Omit<Loan, 'id'> & { id?: string }) => Promise<Loan>;
  deleteLoan: (id: string) => Promise<void>;

  setCashInBank: (n: number) => Promise<void>;
  setInvestmentRate: (id: string, rate: number) => Promise<void>;
  setMonthlyContribution: (n: number) => Promise<void>;
}

const EMPTY: AppData = {
  members: [],
  payments: [],
  investments: [],
  loans: [],
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
    // If the attachment was replaced, drop the old file when nothing else uses it.
    const oldPath = existing.attachmentPath;
    if (oldPath && patch.attachmentPath && patch.attachmentPath !== oldPath) {
      const stillUsed = data.payments.some(
        (p) => p.id !== id && p.attachmentPath === oldPath
      );
      if (!stillUsed) {
        try {
          await storage.deleteAttachment(oldPath);
        } catch {
          // ignore storage cleanup failures
        }
      }
    }
  },

  async deletePayment(id) {
    const { data } = get();
    const target = data.payments.find((p) => p.id === id);
    await withSaving(set, async () => {
      await storage.deletePayment(id);
      // Only remove the stored file if no other payment still references it
      // (bulk payments share one receipt across several months).
      const path = target?.attachmentPath;
      if (path) {
        const stillUsed = data.payments.some(
          (p) => p.id !== id && p.attachmentPath === path
        );
        if (!stillUsed) {
          try {
            await storage.deleteAttachment(path);
          } catch {
            // Orphaned file is harmless; ignore storage cleanup failures.
          }
        }
      }
    });
  },

  async uploadAttachment(file) {
    return withSaving(set, () => storage.uploadAttachment(file));
  },

  async deleteAttachment(path) {
    try {
      await storage.deleteAttachment(path);
    } catch {
      // ignore storage cleanup failures
    }
  },

  async removeAttachment(paymentId) {
    const { data } = get();
    const target = data.payments.find((p) => p.id === paymentId);
    await withSaving(set, async () => {
      await storage.clearPaymentAttachment(paymentId);
      const path = target?.attachmentPath;
      if (path) {
        const stillUsed = data.payments.some(
          (p) => p.id !== paymentId && p.attachmentPath === path
        );
        if (!stillUsed) {
          try {
            await storage.deleteAttachment(path);
          } catch {
            // ignore storage cleanup failures
          }
        }
      }
    });
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

  async upsertLoan(loan) {
    const id = loan.id ?? uuid();
    const result: Loan = { ...(loan as Omit<Loan, 'id'>), id };
    await withSaving(set, () => storage.saveLoan(result));
    return result;
  },

  async deleteLoan(id) {
    await withSaving(set, () => storage.deleteLoan(id));
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
