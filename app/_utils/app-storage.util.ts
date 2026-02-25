import { get, set, del, createStore } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';

// Custom IndexedDB storage for Zustand
const customStore = createStore('study-perk-db', 'study-perk-store');

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name, customStore)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value, customStore);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name, customStore);
  },
};
