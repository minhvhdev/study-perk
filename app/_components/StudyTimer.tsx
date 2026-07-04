'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useStudyStore } from '@/app/_store-study';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { cn } from '@/app/_utils/app-cn.util';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOUND_URLS } from '@/app/_constants/study-sounds.constant';

const DURATION_OPTIONS = [
  { label: '30m', value: 1800 },
  { label: '1h', value: 3600 },
  { label: '1.5h', value: 5400 },
  { label: '2h', value: 7200 },
];

export const StudyTimer = () => {
  const {
    remainingSeconds,
    targetSeconds,
    status,
    startTimer,
    stopTimer,
    resetTimer,
    tick,
    setTargetSeconds,
    syncWithIndexedDB,
    settings,
  } = useStudyStore();
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].studyPage;

  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    if (mounted) {
      syncWithIndexedDB();
    }
  }, [mounted, syncWithIndexedDB]);

  // Handle Tick
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, tick]);

  // Handle Ambient Sound
  useEffect(() => {
    if (status === 'running' && settings.ambientEnabled) {
      if (!ambientAudioRef.current) {
        ambientAudioRef.current = new Audio(SOUND_URLS[settings.ambientSound]);
        ambientAudioRef.current.loop = true;
      } else {
        ambientAudioRef.current.src = SOUND_URLS[settings.ambientSound];
      }
      ambientAudioRef.current
        .play()
        .catch((e) => console.error('Audio play failed:', e));
    } else {
      ambientAudioRef.current?.pause();
    }
  }, [status, settings.ambientEnabled, settings.ambientSound]);

  // Handle Notification Sound
  useEffect(() => {
    if (status === 'finished' && settings.notificationEnabled) {
      if (!notificationAudioRef.current) {
        notificationAudioRef.current = new Audio(
          SOUND_URLS[settings.notificationSound],
        );
      } else {
        notificationAudioRef.current.src =
          SOUND_URLS[settings.notificationSound];
      }
      notificationAudioRef.current
        .play()
        .catch((e) => console.error('Audio play failed:', e));
    }
  }, [status, settings.notificationEnabled, settings.notificationSound]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progress = 1 - remainingSeconds / targetSeconds;

  const formatTime = (val: number) => val.toString().padStart(2, '0');

  const formatTargetLabel = (value: number) => {
    const hours = Math.floor(value / 3600);
    const mins = (value % 3600) / 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    }

    if (hours > 0) {
      return `${hours}h`;
    }

    return `${mins}m`;
  };

  const adjustTime = useCallback(
    (delta: number) => {
      const newTime = Math.max(60, targetSeconds + delta);
      setTargetSeconds(newTime);
    },
    [targetSeconds, setTargetSeconds],
  );

  const getFinishTimeDisplay = () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + remainingSeconds);
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full px-4 relative h-full justify-center">
      {/* Top Controls: Duration Dropdown */}
      <div className="flex items-center gap-4 z-30">
        <div className="relative">
          <button
            onClick={() =>
              status === 'idle' && setIsDropdownOpen(!isDropdownOpen)
            }
            disabled={status !== 'idle'}
            className={cn(
              'flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border transition-all bg-secondary/40 border-border/50 text-base font-bold',
              status !== 'idle' && 'opacity-50 cursor-not-allowed',
            )}
          >
            <Clock size={16} className="text-primary" />
            <span>{formatTargetLabel(targetSeconds)}</span>
            <ChevronDown
              size={16}
              className={cn(
                'transition-transform',
                isDropdownOpen && 'rotate-180',
              )}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 left-0 w-32 bg-card border border-border rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 z-50"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setTargetSeconds(opt.value);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        'px-4 py-3 rounded-xl text-left text-base font-bold transition-colors',
                        targetSeconds === opt.value
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-secondary',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Circular Timer */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Progress Background */}
        <svg
          className="absolute w-full h-full -rotate-90"
          viewBox="0 0 320 320"
        >
          <circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-secondary/50"
          />
          <motion.circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray="942.47"
            strokeDashoffset={942.47}
            animate={{ strokeDashoffset: 942.47 * (1 - progress) }}
            transition={{ duration: 1, ease: 'linear' }}
            className="text-primary stroke-round"
          />
        </svg>

        {/* Time Display */}
        <div className="z-10 flex flex-col items-center group">
          {status === 'idle' && (
            <div className="flex items-center gap-3 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => adjustTime(-300)}
                className="p-1.5 rounded-full bg-secondary hover:bg-primary/20 hover:text-primary transition-colors"
                aria-label="Decrease 5m"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => adjustTime(300)}
                className="p-1.5 rounded-full bg-secondary hover:bg-primary/20 hover:text-primary transition-colors"
                aria-label="Increase 5m"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
          <span className="text-6xl font-black tracking-tighter tabular-nums text-foreground">
            {formatTime(minutes)}:{formatTime(seconds)}
          </span>
          <div className="mt-2 flex flex-col items-center">
            <span className="text-base font-black text-primary uppercase tracking-[0.2em]">
              {status === 'running' ? t.until : t.ready}
            </span>
            <span className="text-base font-bold text-muted-foreground tabular-nums">
              {getFinishTimeDisplay()}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {status !== 'idle' && (
          <button
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-secondary text-foreground hover:bg-secondary/80 transition-all active:scale-95"
            aria-label="Reset Timer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <RotateCcw size={20} />
            </motion.div>
          </button>
        )}
        <button
          onClick={status === 'running' ? stopTimer : startTimer}
          className={cn(
            'w-16 h-16 rounded-4xl flex items-center justify-center transition-all shadow-lg active:scale-90',
            status === 'running'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground shadow-primary/20',
          )}
          aria-label={status === 'running' ? 'Pause Timer' : 'Start Timer'}
        >
          {status === 'running' ? (
            <Pause size={28} fill="currentColor" />
          ) : (
            <Play size={28} fill="currentColor" className="ml-1" />
          )}
        </button>
      </div>
    </div>
  );
};
