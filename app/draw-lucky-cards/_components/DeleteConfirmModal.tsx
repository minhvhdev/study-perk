'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  count: number;
};

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  count,
}: DeleteConfirmModalProps) => {
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
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="text-muted-foreground font-medium">
                  {description}
                </p>
                {count > 0 && (
                  <div className="inline-block px-3 py-1 bg-secondary rounded-full mt-2">
                    <span className="text-sm font-bold text-secondary-foreground">
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
                className="flex-1 py-5 px-6 font-black text-sm text-destructive hover:bg-destructive/5 transition-colors border-l border-border"
              >
                {t.confirm}
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
