'use client';

import { useRewardSpinStore } from '../_store';
import { cn } from '@/app/_utils/app-cn.util';
import {
  Plus,
  Shuffle,
  ArrowUpDown,
  Scale,
  X,
  Check,
  Coins,
  Coffee,
  Zap,
  Ticket,
  Ghost,
} from 'lucide-react';
import { RewardEntryType } from '../_types/reward-spin.type';
import { useUIStore } from '../../_store';
import { TRANSLATIONS } from '../../_constants/app-translations.constant';

const TYPE_CONFIG = {
  monetary: { icon: Coins, label: 'Monetary', unit: 'kVNĐ' },
  leisure: { icon: Coffee, label: 'Leisure', unit: 'Min' },
  boost: { icon: Zap, label: 'Boost', unit: 'x2' },
  'extra-spin': { icon: Ticket, label: 'Extra Spin', unit: 'Spin' },
  nothing: { icon: Ghost, label: 'Nothing', unit: '-' },
};

export const EntryManager = () => {
  const { language } = useUIStore();
  const t = TRANSLATIONS[language].spinPage;
  const rt = TRANSLATIONS[language].rewardTypes;

  const {
    entries,
    addEntry,
    updateEntry,
    removeEntry,
    shuffleEntries,
    sortEntries,
  } = useRewardSpinStore();

  const totalWeight = entries
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + e.weight, 0);

  return (
    <div className="w-full lg:w-[400px] xl:w-[450px] h-full bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] shrink-0 overflow-hidden">
      {/* Header Actions */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
        <div className="flex gap-2 w-full">
          <button
            onClick={shuffleEntries}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-black hover:bg-primary/20 transition-all active:scale-95"
          >
            <Shuffle size={14} />
            {t.shuffle}
          </button>
          <button
            onClick={sortEntries}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-black hover:bg-primary/20 transition-all active:scale-95"
          >
            <ArrowUpDown size={14} />
            {t.sort}
          </button>
        </div>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {entries.map((entry) => {
          const Config = TYPE_CONFIG[entry.type];
          const Icon = Config.icon;

          return (
            <div
              key={entry.id}
              className={cn(
                'group flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-200',
                entry.enabled
                  ? 'bg-secondary/40 border-border shadow-sm'
                  : 'bg-muted/10 border-transparent opacity-60',
              )}
            >
              <div className="flex items-center gap-3">
                {/* Type Icon & Select */}
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: entry.color }}
                  >
                    <Icon size={20} />
                  </div>
                </div>

                {/* Name / Label */}
                <input
                  type="text"
                  value={entry.name || ''}
                  onChange={(e) =>
                    updateEntry(entry.id, { name: e.target.value })
                  }
                  placeholder={entry.label}
                  className="flex-1 bg-transparent border-none outline-none font-black text-lg text-foreground placeholder:text-muted-foreground/30"
                />

                {/* Remove Button */}
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="text-muted-foreground hover:text-destructive transition-all"
                >
                  <X size={18} />
                </button>

                {/* Enabled Toggle */}
                <button
                  onClick={() =>
                    updateEntry(entry.id, { enabled: !entry.enabled })
                  }
                  className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all',
                    entry.enabled
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30'
                      : 'bg-transparent border-muted-foreground/20',
                  )}
                >
                  {entry.enabled && <Check size={14} strokeWidth={4} />}
                </button>
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-2 gap-2">
                {/* Type Selection */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase ml-1">
                    {t.type}
                  </span>
                  <select
                    value={entry.type}
                    onChange={(e) =>
                      updateEntry(entry.id, {
                        type: e.target.value as RewardEntryType,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-secondary border border-border/50 text-sm font-bold outline-none appearance-none cursor-pointer hover:bg-secondary/80 transition-colors"
                  >
                    {Object.entries(TYPE_CONFIG).map(([key]) => (
                      <option key={key} value={key}>
                        {rt[key as keyof typeof rt]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Base Value */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase ml-1">
                    {t.value} ({Config.unit})
                  </span>
                  <input
                    type="number"
                    value={entry.baseValue}
                    onChange={(e) =>
                      updateEntry(entry.id, {
                        baseValue: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-secondary border border-border/50 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Weight / Percentage */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase ml-1">
                    {t.weight} (%)
                  </span>
                  <div className="relative flex items-center">
                    <Scale
                      size={14}
                      className="absolute left-3 text-muted-foreground/50"
                    />
                    <input
                      type="number"
                      value={entry.weight}
                      onChange={(e) =>
                        updateEntry(entry.id, {
                          weight: Number(e.target.value) || 1,
                        })
                      }
                      className="w-full h-10 pl-9 pr-14 rounded-xl bg-secondary border border-border/50 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <span className="absolute right-3 text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {totalWeight > 0
                        ? Math.round((entry.weight / totalWeight) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                {/* Color */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase ml-1">
                    {t.color}
                  </span>
                  <div className="flex items-center gap-2 h-10 px-2 rounded-xl bg-secondary border border-border/50">
                    <input
                      type="color"
                      value={entry.color}
                      onChange={(e) =>
                        updateEntry(entry.id, { color: e.target.value })
                      }
                      className="w-8 h-6 rounded bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground truncate">
                      {entry.color.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Add Button */}
      <div className="p-4 border-t border-border bg-card">
        <button
          onClick={addEntry}
          className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-black text-base hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-98"
        >
          <Plus size={20} strokeWidth={3} />
          {t.addEntry}
        </button>
      </div>
    </div>
  );
};
