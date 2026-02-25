'use client';

import { useRewardSpinStore } from '@/app/reward-spin/_store';
import { Wallet as WalletIcon, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';

export const Wallet = () => {
  const { rewardHistory, totalCashedOut, cashOut } = useRewardSpinStore();
  const { language } = useUIStore();
  const [isHovered, setIsHovered] = useState(false);

  const currentUsedMoney = useMemo(() => {
    return rewardHistory
      .filter(
        (item) => item.type === 'monetary' && item.isUsed && !item.isCashedOut,
      )
      .reduce((sum, item) => sum + item.baseValue * (item.multiplier ?? 1), 0);
  }, [rewardHistory]);

  const t = TRANSLATIONS[language].wallet;

  return (
    <div className="relative flex items-center gap-4">
      <motion.div
        className="flex items-center gap-3 bg-card border border-border px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => currentUsedMoney > 0 && cashOut()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
          <WalletIcon size={20} />
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">
            {t.used}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-foreground">
              {currentUsedMoney}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              kVNĐ
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-border mx-1" />

        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">
            {t.cashed}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-green-500">
              {totalCashedOut}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              kVNĐ
            </span>
          </div>
        </div>

        {currentUsedMoney > 0 && (
          <div className="ml-2 p-1 rounded-full bg-primary/10 text-primary animate-pulse">
            <ArrowUpRight size={14} />
          </div>
        )}
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-3 z-100 whitespace-nowrap"
          >
            <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2">
              {currentUsedMoney > 0 ? (
                <>
                  <WalletIcon size={12} className="text-amber-400" />
                  {t.tooltip}
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} className="text-green-400" />
                  {t.empty}
                </>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute -top-1 right-8 w-2 h-2 bg-slate-900 border-t border-l border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
