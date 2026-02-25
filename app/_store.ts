import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { UIState, Language, TabId } from './_types/app-ui.type';
import { indexedDBStorage } from './_utils/app-storage.util';

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        isSidebarCollapsed: false,
        language: 'en',
        activeTab: 'study',
        setSidebarCollapsed: (collapsed: boolean) =>
          set({ isSidebarCollapsed: collapsed }),
        setLanguage: (lang: Language) => set({ language: lang }),
        setActiveTab: (tab: TabId) => set({ activeTab: tab }),
      }),
      {
        name: 'ui-storage',
        storage: createJSONStorage(() => indexedDBStorage),
      },
    ),
    { name: 'UI Store' },
  ),
);
