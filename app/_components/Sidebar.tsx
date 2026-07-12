'use client';

import { cn } from '@/app/_utils/app-cn.util';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import {
  BookOpen,
  Dices,
  Spade,
  Trophy,
  Users,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TabId } from '@/app/_types/app-ui.type';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useRewardSpinStore } from '@/app/reward-spin/_store';
import { useSession } from '@/app/_hooks/useSession';
import { useHydrated } from '@/app/_hooks/useHydrated';

const sidebarItems = [
  { id: 'study', icon: BookOpen, href: '/' },
  { id: 'spin', icon: Dices, href: '/reward-spin' },
  { id: 'draw', icon: Spade, href: '/draw-lucky-cards' },
  { id: 'rewards', icon: Trophy, href: '/rewards-received' },
  { id: 'admin', icon: Users, href: '/admin', adminOnly: true },
];

export const Sidebar = () => {
  const hydrated = useHydrated();
  const {
    isSidebarCollapsed,
    setSidebarCollapsed,
    language,
    activeTab,
    setActiveTab,
  } = useUIStore();
  const { spinCount, rewardHistory, boostCount } = useRewardSpinStore();
  const { isAdmin } = useSession();

  const drawCount = rewardHistory.filter(
    (item) => item.multiplier === undefined && item.type !== 'nothing',
  ).length;

  const rewardCount = rewardHistory.filter(
    (item) =>
      item.multiplier !== undefined &&
      item.isUsed === false &&
      item.type !== 'nothing',
  ).length;

  const t = TRANSLATIONS[language];
  const pathname = usePathname();
  const visibleSidebarItems = sidebarItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  useEffect(() => {
    const activeItem = sidebarItems.find((item) => item.href === pathname);
    if (activeItem) {
      setActiveTab(activeItem.id as TabId);
    }
  }, [pathname, setActiveTab]);

  if (!hydrated) {
    return (
      <aside className="h-screen sticky top-0 w-20 bg-card border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50" />
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarCollapsed ? 80 : 280 }}
      className={cn(
        'h-screen sticky top-0 bg-card border-r border-border flex flex-col transition-colors duration-300',
        'shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50',
      )}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap">
        <div className="min-w-[40px] h-[40px] rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <GraduationCap size={24} />
        </div>
        {!isSidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-l from-primary to-teal-600"
          >
            {t.appName}
          </motion.span>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {visibleSidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon
                size={22}
                className={cn(
                  'min-w-[22px]',
                  isActive
                    ? 'animate-pulse'
                    : 'group-hover:scale-110 transition-transform',
                )}
              />
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-medium text-base"
                >
                  {t.tabs[item.id as TabId]}
                </motion.span>
              )}

              {/* Badge for Let's Study (Boost) */}
              {item.id === 'study' && boostCount > 0 && (
                <div
                  className={cn(
                    'absolute flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all',
                    isSidebarCollapsed ? 'top-1.5 right-1.5' : 'right-3',
                    isActive
                      ? 'bg-teal-400 text-teal-950'
                      : 'bg-primary text-primary-foreground',
                  )}
                >
                  {boostCount > 99 ? '99+' : boostCount}
                </div>
              )}

              {/* Badge for Reward Spin */}
              {item.id === 'spin' && spinCount > 0 && (
                <div
                  className={cn(
                    'absolute flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all',
                    isSidebarCollapsed ? 'top-1.5 right-1.5' : 'right-3',
                    isActive
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-primary text-primary-foreground',
                  )}
                >
                  {spinCount > 99 ? '99+' : spinCount}
                </div>
              )}

              {/* Badge for Draw Lucky Card */}
              {item.id === 'draw' && drawCount > 0 && (
                <div
                  className={cn(
                    'absolute flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all',
                    isSidebarCollapsed ? 'top-1.5 right-1.5' : 'right-3',
                    isActive
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-primary text-primary-foreground',
                  )}
                >
                  {drawCount > 99 ? '99+' : drawCount}
                </div>
              )}

              {/* Badge for Rewards Received */}
              {item.id === 'rewards' && rewardCount > 0 && (
                <div
                  className={cn(
                    'absolute flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all',
                    isSidebarCollapsed ? 'top-1.5 right-1.5' : 'right-3',
                    isActive
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-primary text-primary-foreground',
                  )}
                >
                  {rewardCount > 99 ? '99+' : rewardCount}
                </div>
              )}

              {isActive && isSidebarCollapsed && (
                <div className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-border">
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>
    </motion.aside>
  );
};
