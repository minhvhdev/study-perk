'use client';

import { RewardWheel } from './_components/RewardWheel';
import { EntryManager } from './_components/EntryManager';
import { useRewardSpinStore } from './_store';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useUIStore } from '../_store';
import { TRANSLATIONS } from '../_constants/app-translations.constant';

const RewardSpinPage = () => {
  const { winner, claimWinner } = useRewardSpinStore();
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].spinPage;

  return (
    <div className="lg:h-[calc(100vh-120px)] flex flex-col lg:flex-row bg-background rounded-4xl overflow-hidden border border-border shadow-2xl relative">
      {/* Left Content: The Wheel */}
      <RewardWheel />

      {/* Right Content: Entry Management */}
      <EntryManager />

      {/* Winner Overlay */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-card w-full max-w-md p-8 rounded-4xl border border-primary/20 shadow-2xl flex flex-col items-center text-center gap-6 relative overflow-hidden"
            >
              {/* Confetti-like bits could be added here */}
              <div className="absolute top-0 inset-x-0 h-2 bg-linear-to-r from-primary via-purple-500 to-primary animate-gradient" />

              <button
                onClick={claimWinner}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
                <Trophy size={40} />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight">
                  {t.congrats}
                </h2>
                <p className="text-muted-foreground text-lg">{t.youWon}</p>
              </div>

              <div
                className="px-10 py-6 rounded-4xl text-4xl font-black shadow-xl border-4 border-white/10 dark:border-black/10"
                style={{ backgroundColor: winner.color, color: '#fff' }}
              >
                {winner.label}
              </div>

              <button
                onClick={claimWinner}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/30"
              >
                {t.awesome}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RewardSpinPage;
