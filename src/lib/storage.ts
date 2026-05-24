import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { AppData, Investment, Member, Payment } from '../types';

const MEMBERS = 'members';
const PAYMENTS = 'payments';
const INVESTMENTS = 'investments';
const CONFIG_DOC = doc(db, 'config', 'fund');

export interface DataStore {
  subscribe(onChange: (data: AppData) => void): Unsubscribe;
  saveMember(member: Member): Promise<void>;
  deleteMember(id: string): Promise<void>;
  savePayment(payment: Payment): Promise<void>;
  deletePayment(id: string): Promise<void>;
  saveInvestment(inv: Investment): Promise<void>;
  deleteInvestment(id: string): Promise<void>;
  setCashInBank(n: number): Promise<void>;
  setMonthlyContribution(n: number): Promise<void>;
}

const EMPTY: AppData = {
  members: [],
  payments: [],
  investments: [],
  cashInBank: 0,
  monthlyContribution: 2000,
  lastUpdated: new Date().toISOString(),
};

function withStamp(): { lastUpdated: string } {
  return { lastUpdated: new Date().toISOString() };
}

class FirestoreStore implements DataStore {
  subscribe(onChange: (data: AppData) => void): Unsubscribe {
    const current: AppData = { ...EMPTY };
    let configReady = false;
    let membersReady = false;
    let paymentsReady = false;
    let investmentsReady = false;

    const emit = () => {
      if (configReady && membersReady && paymentsReady && investmentsReady) {
        onChange({ ...current });
      }
    };

    const unsubMembers = onSnapshot(collection(db, MEMBERS), (snap) => {
      current.members = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Member);
      membersReady = true;
      emit();
    });
    const unsubPayments = onSnapshot(collection(db, PAYMENTS), (snap) => {
      current.payments = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Payment
      );
      paymentsReady = true;
      emit();
    });
    const unsubInvestments = onSnapshot(
      collection(db, INVESTMENTS),
      (snap) => {
        current.investments = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Investment
        );
        investmentsReady = true;
        emit();
      }
    );
    const unsubConfig = onSnapshot(CONFIG_DOC, (snap) => {
      const d = snap.data();
      current.cashInBank = (d?.cashInBank as number | undefined) ?? 0;
      current.monthlyContribution =
        (d?.monthlyContribution as number | undefined) ?? 2000;
      current.lastUpdated =
        (d?.lastUpdated as string | undefined) ?? new Date().toISOString();
      configReady = true;
      emit();
    });

    return () => {
      unsubMembers();
      unsubPayments();
      unsubInvestments();
      unsubConfig();
    };
  }

  async saveMember(member: Member): Promise<void> {
    const { id, ...rest } = member;
    await setDoc(doc(db, MEMBERS, id), rest, { merge: true });
  }

  async deleteMember(id: string): Promise<void> {
    await deleteDoc(doc(db, MEMBERS, id));
  }

  async savePayment(payment: Payment): Promise<void> {
    const { id, ...rest } = payment;
    await setDoc(doc(db, PAYMENTS, id), rest, { merge: true });
  }

  async deletePayment(id: string): Promise<void> {
    await deleteDoc(doc(db, PAYMENTS, id));
  }

  async saveInvestment(inv: Investment): Promise<void> {
    const { id, ...rest } = inv;
    await setDoc(doc(db, INVESTMENTS, id), rest, { merge: true });
  }

  async deleteInvestment(id: string): Promise<void> {
    await deleteDoc(doc(db, INVESTMENTS, id));
  }

  async setCashInBank(n: number): Promise<void> {
    await setDoc(CONFIG_DOC, { cashInBank: n, ...withStamp() }, { merge: true });
  }

  async setMonthlyContribution(n: number): Promise<void> {
    await setDoc(
      CONFIG_DOC,
      { monthlyContribution: n, ...withStamp() },
      { merge: true }
    );
  }
}

export async function bootstrapConfig(): Promise<void> {
  await setDoc(
    CONFIG_DOC,
    {
      cashInBank: 0,
      monthlyContribution: 2000,
      ...withStamp(),
    },
    { merge: true }
  );
}

export async function touchLastUpdated(): Promise<void> {
  await updateDoc(CONFIG_DOC, withStamp());
}

export const storage: DataStore = new FirestoreStore();
