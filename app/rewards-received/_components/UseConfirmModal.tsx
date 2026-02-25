'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';

type UseConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  count?: number;
};

export const UseConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  count,
}: UseConfirmModalProps) => {
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].common;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-card border border-border rounded-4xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6 mx-auto">
                <Zap size={32} fill="currentColor" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="text-muted-foreground font-medium">
                  {description}
                </p>
                {count !== undefined && count > 1 && (
                  <div className="inline-block px-3 py-1 bg-secondary rounded-full mt-2">
                    <span className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">
                      {t.itemsSelected.replace('{count}', count.toString())}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex border-t border-border">
              <button
                onClick={onClose}
                className="flex-1 py-5 px-6 font-bold text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-5 px-6 font-black text-sm text-primary hover:bg-primary/5 transition-colors border-l border-border"
              >
                {t.useNow}
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
