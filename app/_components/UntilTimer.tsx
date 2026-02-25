'use client';

import { useState, useEffect } from 'react';
import { useStudyStore } from '@/app/_store-study';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { cn } from '@/app/_utils/app-cn.util';
import { Play, Clock, ChevronUp, ChevronDown } from 'lucide-react';

export const UntilTimer = () => {
  const { status, startTimer, setTargetSeconds } = useStudyStore();
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].studyPage;

  const [targetTime, setTargetTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now;
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  const adjustTime = (minutes: number) => {
    const newTime = new Date(targetTime);
    newTime.setMinutes(newTime.getMinutes() + minutes);
    setTargetTime(newTime);
  };

  const handleStart = () => {
    const now = new Date();
    let diffMs = targetTime.getTime() - now.getTime();

    // If target is in the past, add 24 hours
    if (diffMs <= 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    setTargetSeconds(diffSeconds);
    startTimer();
  };

  if (!mounted) return null;

  const currentHours = targetTime.getHours().toString().padStart(2, '0');
  const currentMinutes = targetTime.getMinutes().toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-8 py-10 w-full px-4 relative h-full justify-center">
      {/* Label on top-left of section */}
      <div className="absolute top-6 left-8 flex flex-col gap-0.5">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">
          {t.untilClock}
        </span>
      </div>

      <div className="flex flex-col items-center gap-6 mt-4">
        {/* Time Picker UI */}
        <div className="flex items-center gap-4">
          {/* Hours */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => adjustTime(60)}
              disabled={status !== 'idle'}
              className="p-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronUp size={24} />
            </button>
            <div className="w-20 h-24 bg-secondary/30 rounded-4xl border border-border/50 flex items-center justify-center shadow-inner">
              <span className="text-4xl font-black tabular-nums">
                {currentHours}
              </span>
            </div>
            <button
              onClick={() => adjustTime(-60)}
              disabled={status !== 'idle'}
              className="p-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronDown size={24} />
            </button>
          </div>

          <span className="text-4xl font-black text-muted-foreground mb-4">
            :
          </span>

          {/* Minutes */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => adjustTime(5)}
              disabled={status !== 'idle'}
              className="p-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronUp size={24} />
            </button>
            <div className="w-20 h-24 bg-secondary/30 rounded-4xl border border-border/50 flex items-center justify-center shadow-inner">
              <span className="text-4xl font-black tabular-nums">
                {currentMinutes}
              </span>
            </div>
            <button
              onClick={() => adjustTime(-5)}
              disabled={status !== 'idle'}
              className="p-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronDown size={24} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
            {t.targetEndTime}
          </span>
          <div className="flex items-center gap-2 text-primary font-bold">
            <Clock size={14} />
            <span className="text-sm">
              {t.todayAt.replace('{time}', `${currentHours}:${currentMinutes}`)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleStart}
          disabled={status !== 'idle'}
          className={cn(
            'w-20 h-20 rounded-4xl flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95',
            status === 'running'
              ? 'bg-destructive/50 text-destructive-foreground cursor-not-allowed grayscale'
              : 'bg-primary text-primary-foreground shadow-primary/20',
          )}
          aria-label="Start Until Timer"
        >
          <Play size={32} fill="currentColor" className="ml-1" />
        </button>
      </div>
    </div>
  );
};
