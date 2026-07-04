'use client';

import { useState } from 'react';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { Menu, Sun, Moon, Globe, LogOut, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';
import { TabId } from '@/app/_types/app-ui.type';
import { useSession } from '@/app/_hooks/useSession';
import { useHydrated } from '@/app/_hooks/useHydrated';

export const Navbar = () => {
  const hydrated = useHydrated();
  const {
    isSidebarCollapsed,
    setSidebarCollapsed,
    language,
    setLanguage,
    activeTab,
  } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, isAdmin } = useSession();

  const t = TRANSLATIONS[language];

  if (!hydrated) {
    return (
      <header className="sticky top-0 z-40 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300" />
    );
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      window.location.assign('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

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
          {user && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm font-medium border border-transparent">
              {isAdmin && <Shield size={14} className="text-primary" />}
              <span className="text-muted-foreground">{t.auth.signedInAs}</span>
              <span className="font-black text-foreground">{user.username}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-base font-medium hover:bg-secondary/80 transition-all border border-transparent hover:border-primary/20 disabled:opacity-60"
          >
            <LogOut size={16} className="text-primary" />
            <span>{isLoggingOut ? t.auth.loggingOut : t.auth.logout}</span>
          </button>

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
            <span className="dark:hidden">
              <Moon size={18} />
            </span>
            <span className="hidden dark:inline">
              <Sun size={18} />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
