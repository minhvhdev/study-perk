'use client';

import { Loader2 } from 'lucide-react';

import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { useUIStore } from '@/app/_store';

type AppLoadingScreenProps = {
  message?: string;
  fullScreen?: boolean;
};

export function AppLoadingScreen({
  message,
  fullScreen = false,
}: AppLoadingScreenProps) {
  const { language } = useUIStore();
  const label = message ?? TRANSLATIONS[language].common.loadingData;

  return (
    <div
      className={
        fullScreen
          ? 'flex min-h-screen items-center justify-center bg-background text-foreground'
          : 'flex flex-1 items-center justify-center min-h-[60vh]'
      }
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
