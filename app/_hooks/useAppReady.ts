'use client';

import { useEffect, useSyncExternalStore } from 'react';

import { useStudyStore } from '@/app/_store-study';
import { useRewardSpinStore } from '@/app/reward-spin/_store';
import { useHydrated } from '@/app/_hooks/useHydrated';
import { useSession } from '@/app/_hooks/useSession';

const PERSISTED_STORES = [useStudyStore, useRewardSpinStore] as const;

function getPersistStoresReady() {
  return PERSISTED_STORES.every((store) => store.persist.hasHydrated());
}

function subscribePersistHydration(onStoreChange: () => void) {
  const unsubscribers = PERSISTED_STORES.map((store) =>
    store.persist.onFinishHydration(onStoreChange),
  );

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

function usePersistStoresReady() {
  const ready = useSyncExternalStore(
    subscribePersistHydration,
    getPersistStoresReady,
    () => false,
  );

  useEffect(() => {
    void Promise.all(
      PERSISTED_STORES.map((store) => store.persist.rehydrate()),
    );
  }, []);

  return ready;
}

export function useAppReady() {
  const hydrated = useHydrated();
  const { isLoading: sessionLoading } = useSession();
  const persistStoresReady = usePersistStoresReady();

  return hydrated && !sessionLoading && persistStoresReady;
}
