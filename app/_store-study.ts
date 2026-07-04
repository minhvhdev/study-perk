import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { StudyState, StudySettings, TimerStatus } from './_types/study.type';
import { remoteStateStorage } from './_utils/app-remote-storage.util';
import { useRewardSpinStore } from './reward-spin/_store';

const DEFAULT_SETTINGS: StudySettings = {
  notificationEnabled: true,
  notificationSound: 'commericalBreak',
  ambientEnabled: false,
  ambientSound: 'rain',
};

export const useStudyStore = create<StudyState>()(
  devtools(
    persist(
      (set, get) => ({
        targetSeconds: 3600,
        remainingSeconds: 3600,
        status: 'idle' as TimerStatus,
        finishTime: null,
        history: [],
        settings: DEFAULT_SETTINGS,
        studyTypes: [
          { id: '1', name: 'English', color: '#8b5cf6' },
          { id: '2', name: 'French', color: '#ec4899' },
        ],
        currentTypeId: '1',
        isBoostEnabled: false,

        setTargetSeconds: (seconds) => {
          if (get().status === 'idle') {
            set({ targetSeconds: seconds, remainingSeconds: seconds });
          }
        },

        startTimer: () => {
          const now = Date.now();
          const finishTime = now + get().remainingSeconds * 1000;
          set({ status: 'running', finishTime });
        },

        stopTimer: () => {
          set({ status: 'idle', finishTime: null });
        },

        resetTimer: () => {
          set((state) => ({
            status: 'idle',
            finishTime: null,
            remainingSeconds: state.targetSeconds,
          }));
        },

        tick: () => {
          const { status, finishTime } = get();
          if (status !== 'running' || !finishTime) return;

          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((finishTime - now) / 1000));

          if (remaining === 0) {
            const finishedDuration = get().targetSeconds;
            const isBoosted = get().isBoostEnabled;
            get().addSession(finishedDuration, isBoosted);

            // Add a spin reward
            useRewardSpinStore.getState().addSpin(isBoosted);

            set({
              status: 'idle',
              finishTime: null,
              remainingSeconds: get().targetSeconds,
              isBoostEnabled: false,
            });
          } else {
            set({ remainingSeconds: remaining });
          }
        },

        syncWithIndexedDB: () => {
          const { status, finishTime, targetSeconds } = get();
          if (status === 'running' && finishTime) {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((finishTime - now) / 1000));
            if (remaining === 0) {
              set({
                status: 'idle',
                finishTime: null,
                remainingSeconds: targetSeconds,
              });
            } else {
              set({ remainingSeconds: remaining });
            }
          } else if (status === 'idle') {
            set({ remainingSeconds: targetSeconds });
          }
        },

        addSession: (duration, isBoosted = false) => {
          const currentTypeId = get().currentTypeId;
          set((state) => ({
            history: [
              ...state.history,
              {
                id: Math.random().toString(36).substring(2, 9),
                duration,
                timestamp: Date.now(),
                typeId: currentTypeId || undefined,
                isBoosted,
              },
            ],
          }));
        },

        removeSessions: (ids) => {
          set((state) => ({
            history: state.history.filter((s) => !ids.includes(s.id)),
          }));
        },

        updateSettings: (updates) => {
          set((state) => ({
            settings: { ...state.settings, ...updates },
          }));
        },

        addStudyType: (type) => {
          const newType = {
            ...type,
            id: Math.random().toString(36).substring(2, 9),
          };
          set((state) => ({
            studyTypes: [...state.studyTypes, newType],
          }));
        },

        removeStudyType: (id) => {
          set((state) => ({
            studyTypes: state.studyTypes.filter((t) => t.id !== id),
            currentTypeId:
              state.currentTypeId === id ? null : state.currentTypeId,
          }));
        },

        setCurrentTypeId: (id) => {
          set({ currentTypeId: id });
        },
        setBoostEnabled: (enabled) => {
          set({ isBoostEnabled: enabled });
        },
      }),
      {
        name: 'study-perk-timer',
        storage: createJSONStorage(() => remoteStateStorage),
        partialize: (state: StudyState) => ({
          targetSeconds: state.targetSeconds,
          history: state.history,
          finishTime: state.finishTime,
          status: state.status === 'running' ? 'running' : 'idle',
          settings: state.settings,
          studyTypes: state.studyTypes,
          currentTypeId: state.currentTypeId,
          isBoostEnabled: state.isBoostEnabled,
        }),
      },
    ),
    { name: 'Study Store' },
  ),
);
