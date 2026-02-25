'use client';

import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { Menu, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { TabId } from '@/app/_types/app-ui.type';

export const Navbar = () => {
  const {
    isSidebarCollapsed,
    setSidebarCollapsed,
    language,
    setLanguage,
    activeTab,
  } = useUIStore();
  const { theme, setTheme } = useTheme();

  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Toggle Button */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Center: Tab Title */}
        <div className="absolute left-1/2 -translate-x-1/2 font-bold text-lg text-foreground">
          {t.tabs[activeTab as TabId]}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-base font-medium hover:bg-secondary/80 transition-all border border-transparent hover:border-primary/20"
          >
            <Globe size={16} className="text-primary" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-full hover:bg-secondary text-muted-foreground transition-all border border-transparent hover:border-primary/20"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
