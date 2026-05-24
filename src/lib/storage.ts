import type { AppData } from '../types';

const STORAGE_KEY = 'pfnk-data';

export interface DataStore {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
}

class LocalStorageStore implements DataStore {
  async load(): Promise<AppData | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppData) : null;
    } catch {
      return null;
    }
  }

  async save(data: AppData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  }
}

export const storage: DataStore = new LocalStorageStore();
