'use client';

import { RewardTable } from './_components/RewardTable';
import { Spade } from 'lucide-react';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';

const DrawLuckyCardsPage = () => {
  const { language } = useUIStore();
  const t = TRANSLATIONS[language];

  return (
    <div className="h-full flex flex-col gap-6 bg-background rounded-4xl p-8 overflow-hidden border border-border shadow-2xl">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
            <Spade size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
              {t.tabs.draw as string}
            </h1>
            <p className="text-muted-foreground font-medium">
              {t.drawLuckyCardsPage.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <RewardTable />
      </div>
    </div>
  );
};

export default DrawLuckyCardsPage;
