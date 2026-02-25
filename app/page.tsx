'use client';

import { useUIStore } from './_store';
import { TRANSLATIONS } from './_constants/app-translations.constant';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyTimer } from './_components/StudyTimer';
import { StudyTodayCard, StudyChartCard } from './_components/StudyStats';
import { StudyTypeCard, StudySoundsCard } from './_components/StudySettings';

export default function Home() {
  const { activeTab, language } = useUIStore();
  const t = TRANSLATIONS[language];

  return (
    <div className="h-full w-full mx-auto flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          {activeTab === 'study' ? (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
              {/* Row 1: Clock, Stats+Mgmt, Sounds */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* 1. Combined Clock */}
                <div className="flex flex-col items-center justify-center bg-card/30 rounded-[3rem] border border-border/50 py-6 min-h-[400px]">
                  <StudyTimer />
                </div>

                {/* 2. Stats & Management */}
                <div className="flex flex-col gap-6">
                  {/* Total Study Today */}
                  <StudyTodayCard />

                  {/* Study Management */}
                  <StudyTypeCard />
                </div>

                {/* 3. Sounds & Notifications */}
                <StudySoundsCard />
              </div>

              {/* Row 2: History Chart */}
              <StudyChartCard />
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6 text-center py-20 px-4">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                {t.tabs[activeTab]}
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                {t.homePage.placeholderTitle}
              </p>
              <div className="mt-10 p-12 rounded-4xl bg-linear-to-br from-primary/10 via-background to-purple-500/10 border border-primary/20 flex flex-col items-center justify-center text-center gap-6 shadow-2xl shadow-primary/5 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold">{t.homePage.readyToEarn}</h2>
                <p className="text-muted-foreground max-w-md text-lg">
                  {t.homePage.readyToEarnDesc}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
