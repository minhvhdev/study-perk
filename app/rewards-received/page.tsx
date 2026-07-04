'use client';

import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { RewardReceivedTable } from './_components/RewardReceivedTable';
import { Wallet } from './_components/Wallet';
import { LeisureTimer } from './_components/LeisureTimer';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { useHydrated } from '@/app/_hooks/useHydrated';

export default function RewardReceivedPage() {
  const hydrated = useHydrated();
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].rewardsReceivedPage;

  if (!hydrated) {
    return <div className="h-full w-full" />;
  }

  return (
    <div className="h-full flex flex-col gap-6 bg-background rounded-4xl p-8 overflow-hidden border border-border shadow-2xl">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
            <Gift size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
              {t.title}
            </h1>
            <p className="text-muted-foreground font-medium">{t.subtitle}</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-4"
        >
          <LeisureTimer />
          <Wallet />
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <RewardReceivedTable />
      </div>
    </div>
  );
}
