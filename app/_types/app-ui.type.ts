export type Language = 'en' | 'vi';

export type TabId = 'study' | 'spin' | 'draw' | 'rewards';

export type UIState = {
  isSidebarCollapsed: boolean;
  language: Language;
  activeTab: TabId;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLanguage: (lang: Language) => void;
  setActiveTab: (tab: TabId) => void;
};
