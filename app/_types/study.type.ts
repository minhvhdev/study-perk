export type StudyType = {
  id: string;
  name: string;
  color: string;
};

export type StudySession = {
  id: string;
  duration: number; // in seconds
  timestamp: number;
  typeId?: string;
  isBoosted?: boolean;
};

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export type StudySettings = {
  notificationEnabled: boolean;
  notificationSound: string;
  ambientEnabled: boolean;
  ambientSound: string;
};

export type StudyState = {
  targetSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  finishTime: number | null; // Timestamp when the current timer will finish
  history: StudySession[];
  settings: StudySettings;
  studyTypes: StudyType[];
  currentTypeId: string | null;

  setTargetSeconds: (seconds: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  syncWithIndexedDB: () => void;
  addSession: (duration: number, isBoosted?: boolean) => void;
  removeSessions: (ids: string[]) => void;
  updateSettings: (updates: Partial<StudySettings>) => void;
  addStudyType: (type: Omit<StudyType, 'id'>) => void;
  removeStudyType: (id: string) => void;
  setCurrentTypeId: (id: string | null) => void;
  isBoostEnabled: boolean;
  setBoostEnabled: (enabled: boolean) => void;
};
