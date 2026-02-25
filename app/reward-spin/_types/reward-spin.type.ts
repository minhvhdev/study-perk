export type RewardEntryType =
  | 'monetary'
  | 'leisure'
  | 'boost'
  | 'extra-spin'
  | 'nothing';

export type WheelEntry = {
  id: string;
  type: RewardEntryType;
  name?: string;
  baseValue: number;
  label: string; // Dynamic label based on type and value
  color: string;
  weight: number;
  enabled: boolean;
};

export type RewardHistoryItem = {
  id: string;
  entryId: string;
  name?: string;
  type: RewardEntryType;
  baseValue: number;
  receivedAt: number;
  isUsed: boolean;
  multiplier?: number;
  finishedAt?: number;
  usedAt?: number;
  isCashedOut?: boolean;
  cashedOutAt?: number;
};

export type RewardSpinState = {
  entries: WheelEntry[];
  isSpinning: boolean;
  winner: WheelEntry | null;
  spinCount: number;
  rewardHistory: RewardHistoryItem[];
  boostCount: number;
  totalCashedOut: number;
  addEntry: () => void;
  updateEntry: (id: string, updates: Partial<WheelEntry>) => void;
  removeEntry: (id: string) => void;
  shuffleEntries: () => void;
  sortEntries: () => void;
  setSpinning: (spinning: boolean) => void;
  setWinner: (winner: WheelEntry | null) => void;
  addSpin: (useBoost?: boolean) => void;
  decrementSpin: () => void;
  claimWinner: () => void;
  removeHistoryItems: (ids: string[]) => void;
  updateHistoryItem: (id: string, updates: Partial<RewardHistoryItem>) => void;
  claimHistoryItems: (ids: string[]) => void;
  cashOut: () => void;
};
