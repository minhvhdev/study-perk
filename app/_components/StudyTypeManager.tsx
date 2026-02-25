'use client';

import { useState } from 'react';
import { useStudyStore } from '@/app/_store-study';
import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { Plus, X, Settings2 } from 'lucide-react';
import { cn } from '@/app/_utils/app-cn.util';
import { AnimatePresence, motion } from 'framer-motion';

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export const StudyTypeManager = () => {
  const {
    studyTypes,
    addStudyType,
    removeStudyType,
    currentTypeId,
    setCurrentTypeId,
    status,
  } = useStudyStore();
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].studyPage;
  const c = TRANSLATIONS[language].common;
  const [newTypeName, setNewTypeName] = useState('');
  const availableColors = COLORS.filter(
    (color) => !studyTypes.some((type) => type.color === color),
  );
  const [selectedColor, setSelectedColor] = useState(
    availableColors[0] || COLORS[0],
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (!newTypeName.trim()) return;
    addStudyType({
      name: newTypeName.trim(),
      color: selectedColor,
    });
    setNewTypeName('');
    setIsOpen(false);
  };

  const openModal = () => {
    if (availableColors.length > 0) {
      setSelectedColor(availableColors[0]);
    }
    setIsOpen(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
          <Settings2 size={16} />
          {t.manageTypes}
        </h3>
        <button
          onClick={openModal}
          className="p-1 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-base font-bold flex items-center gap-1.5"
        >
          <Plus size={16} />
          {c.add}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[120px] no-scrollbar pr-1">
        {studyTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => status === 'idle' && setCurrentTypeId(type.id)}
            disabled={status !== 'idle'}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-left',
              currentTypeId === type.id
                ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20'
                : 'bg-secondary/50 border-border/50 group hover:border-primary/30',
              status !== 'idle' && 'opacity-60 cursor-not-allowed',
            )}
          >
            <div
              className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
              style={{ backgroundColor: type.color }}
            />
            <span
              className={cn(
                'text-base font-bold',
                currentTypeId === type.id ? 'text-primary' : 'text-foreground',
              )}
            >
              {type.name}
            </span>
            {studyTypes.length > 1 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (status === 'idle') {
                    removeStudyType(type.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all ml-1"
              >
                <X size={10} />
              </div>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-card border border-border shadow-2xl rounded-4xl p-6 flex flex-col gap-5 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-black tracking-tight">
                  {t.newStudyType}
                </h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-base font-bold text-muted-foreground uppercase px-1">
                    {t.categoryName}
                  </span>
                  <input
                    autoFocus
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder={t.typeNamePlaceholder}
                    className="bg-secondary/30 border border-border rounded-2xl px-4 py-3 text-base focus:outline-hidden focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-base font-bold text-muted-foreground uppercase px-1">
                    {t.pickColor}
                  </span>
                  <div className="flex flex-wrap gap-2 px-1">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 shadow-sm',
                          selectedColor === color
                            ? 'border-foreground ring-4 ring-primary/20 scale-110'
                            : 'border-transparent',
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl text-base font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                  {t.createType}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
