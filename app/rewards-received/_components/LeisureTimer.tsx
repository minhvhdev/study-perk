'use client';

import { useRewardSpinStore } from '@/app/reward-spin/_store';
import { Coffee } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { SOUND_URLS } from '@/app/_constants/study-sounds.constant';
import { useRef } from 'react';

export const LeisureTimer = () => {
  const { rewardHistory } = useRewardSpinStore();
  const { language } = useUIStore();
  const translations = TRANSLATIONS[language];
  const [now, setNow] = useState(() =>
    typeof window !== 'undefined' ? Date.now() : 0,
  );
  const wasActive = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const leisureData = useMemo(() => {
    const activeItems = rewardHistory.filter((item) => {
      if (item.type !== 'leisure' || !item.isUsed || !item.usedAt) return false;
      const durationMs = item.baseValue * (item.multiplier ?? 1) * 60 * 1000;
      return item.usedAt + durationMs > now;
    });

    if (activeItems.length === 0) return null;

    const totalRemainingMs = activeItems.reduce((sum, item) => {
      const durationMs = item.baseValue * (item.multiplier ?? 1) * 60 * 1000;
      return sum + Math.max(0, item.usedAt! + durationMs - now);
    }, 0);

    const names = activeItems.map(
      (item) => item.name || translations.rewardTypes.leisure,
    );
    const combinedNames = names.join(' & ');

    const minutes = Math.floor(totalRemainingMs / 60000);
    const seconds = Math.floor((totalRemainingMs % 60000) / 1000);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return {
      time: timeStr,
      names: combinedNames,
    };
  }, [rewardHistory, now, translations]);

  useEffect(() => {
    if (leisureData) {
      wasActive.current = true;
    } else if (wasActive.current) {
      // Timer just finished
      const audio = new Audio(SOUND_URLS.roundEnd);
      audio.play().catch((e) => console.error('Leisure sound failed:', e));
      wasActive.current = false;
    }
  }, [leisureData]);

  if (!leisureData) return null;

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        <LeisureClock
          key="combined-leisure-clock"
          name={leisureData.names}
          time={leisureData.time}
        />
      </AnimatePresence>
    </div>
  );
};

const LeisureClock = ({ name, time }: { name: string; time: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, scale: 0.8, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: -20 }}
        className="flex items-center gap-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-xl shadow-sm hover:bg-blue-500/20 transition-colors cursor-help"
      >
        <Coffee size={14} className="animate-bounce" />
        <span className="text-xs font-black tabular-nums tracking-tighter">
          {time}
        </span>
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute top-full left-1/2 -translate-x-1/2 translate-y-1 mt-3 z-110 whitespace-nowrap"
          >
            <div className="bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl border border-white/10 whitespace-normal text-center leading-relaxed">
              {name}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
