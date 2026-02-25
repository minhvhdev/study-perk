import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import {
  RewardSpinState,
  WheelEntry,
  RewardHistoryItem,
} from './_types/reward-spin.type';
import { indexedDBStorage } from '@/app/_utils/app-storage.util';

const getEntryLabel = (entry: Partial<WheelEntry>) => {
  if (entry.name) return entry.name;
  const val = entry.baseValue || 0;
  switch (entry.type) {
    case 'monetary':
      return `${val}kVNĐ`;
    case 'leisure':
      return `${val} mins`;
    case 'boost':
      return `Boost study (x${val} spin per session)`;
    case 'extra-spin':
      return `Extra Spin (+${val} spin)`;
    case 'nothing':
      return 'Nothing';
    default:
      return '';
  }
};

const DEFAULT_ENTRIES: WheelEntry[] = [
  {
    id: '1',
    type: 'monetary',
    baseValue: 50,
    label: '50kVNĐ',
    color: '#ecc94b',
    weight: 1,
    enabled: true,
  },
  {
    id: '2',
    type: 'leisure',
    baseValue: 15,
    label: '15 mins',
    color: '#4299e1',
    weight: 1,
    enabled: true,
  },
  {
    id: '3',
    type: 'nothing',
    baseValue: 0,
    label: 'Nothing',
    color: '#f56565',
    weight: 1,
    enabled: true,
  },
];

export const useRewardSpinStore = create<RewardSpinState>()(
  devtools(
    persist(
      (set) => ({
        entries: DEFAULT_ENTRIES,
        isSpinning: false,
        winner: null,
        spinCount: 0,
        boostCount: 0,
        rewardHistory: [],
        totalCashedOut: 0,
        addEntry: () =>
          set((state) => {
            const newEntry: WheelEntry = {
              id: Math.random().toString(36).substring(2, 9),
              type: 'nothing',
              baseValue: 0,
              label: 'Nothing',
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
              weight: 1,
              enabled: true,
            };
            return {
              entries: [...state.entries, newEntry],
            };
          }),
        updateEntry: (id, updates) =>
          set((state) => ({
            entries: state.entries.map((entry) => {
              if (entry.id === id) {
                const merged = { ...entry, ...updates };
                return { ...merged, label: getEntryLabel(merged) };
              }
              return entry;
            }),
          })),
        removeEntry: (id) =>
          set((state) => ({
            entries: state.entries.filter((entry) => entry.id !== id),
          })),
        shuffleEntries: () =>
          set((state) => ({
            entries: [...state.entries].sort(() => Math.random() - 0.5),
          })),
        sortEntries: () =>
          set((state) => ({
            entries: [...state.entries].sort((a, b) =>
              a.label.localeCompare(b.label),
            ),
          })),
        setSpinning: (spinning) => set({ isSpinning: spinning }),
        setWinner: (winner) => set({ winner }),
        addSpin: (useBoost = false) =>
          set((state) => {
            const shouldBoost = useBoost && state.boostCount > 0;
            const amount = shouldBoost ? 2 : 1;
            return {
              spinCount: state.spinCount + amount,
              boostCount: shouldBoost ? state.boostCount - 1 : state.boostCount,
            };
          }),
        decrementSpin: () =>
          set((state) => ({ spinCount: Math.max(0, state.spinCount - 1) })),
        claimWinner: () =>
          set((state) => {
            if (!state.winner) return state;
            const updates: Partial<RewardSpinState> = { winner: null };

            // Add to history if not "nothing"
            if (state.winner.type !== 'nothing') {
              const historyItem: RewardHistoryItem = {
                id: Math.random().toString(36).substring(2, 9),
                entryId: state.winner.id,
                name: state.winner.name,
                type: state.winner.type,
                baseValue: state.winner.baseValue,
                receivedAt: Date.now(),
                isUsed: false,
              };
              updates.rewardHistory = [historyItem, ...state.rewardHistory];
            }

            return updates;
          }),
        removeHistoryItems: (ids) =>
          set((state) => ({
            rewardHistory: state.rewardHistory.filter(
              (item) => !ids.includes(item.id),
            ),
          })),
        updateHistoryItem: (id, updates) =>
          set((state) => ({
            rewardHistory: state.rewardHistory.map((item) =>
              item.id === id ? { ...item, ...updates } : item,
            ),
          })),
        claimHistoryItems: (ids: string[]) =>
          set((state) => {
            let extraSpins = 0;
            let extraBoosts = 0;

            const newHistory = state.rewardHistory.map((item) => {
              if (ids.includes(item.id) && !item.isUsed) {
                const multiplier = item.multiplier ?? 1;
                if (item.type === 'extra-spin') {
                  extraSpins += item.baseValue * multiplier;
                } else if (item.type === 'boost') {
                  extraBoosts += item.baseValue * multiplier;
                }
                return { ...item, isUsed: true, usedAt: Date.now() };
              }
              return item;
            });

            return {
              rewardHistory: newHistory,
              spinCount: state.spinCount + extraSpins,
              boostCount: state.boostCount + extraBoosts,
            };
          }),
        cashOut: () =>
          set((state) => {
            let extraMoney = 0;
            const newHistory = state.rewardHistory.map((item) => {
              if (
                item.type === 'monetary' &&
                item.isUsed &&
                !item.isCashedOut
              ) {
                extraMoney += item.baseValue * (item.multiplier ?? 1);
                return { ...item, isCashedOut: true, cashedOutAt: Date.now() };
              }
              return item;
            });
            return {
              rewardHistory: newHistory,
              totalCashedOut: state.totalCashedOut + extraMoney,
            };
          }),
      }),
      {
        name: 'reward-spin-storage',
        storage: createJSONStorage(() => indexedDBStorage),
        partialize: (state) => ({
          entries: state.entries,
          spinCount: state.spinCount,
          boostCount: state.boostCount,
          rewardHistory: state.rewardHistory,
          totalCashedOut: state.totalCashedOut,
        }),
      },
    ),
    { name: 'Reward Spin Store' },
  ),
);
