import { useEffect, useMemo, useState } from 'react';

import { getUserJsonState } from '@/app/_utils/app-remote-storage.util';
import { RewardHistoryItem } from '@/app/reward-spin/_types/reward-spin.type';

export type DrawCardStatus = 'Available' | 'InProcess' | 'Done';

function buildStatusSnapshot(rewardHistory: RewardHistoryItem[]) {
  const drawableItems = rewardHistory.filter((item) => item.type !== 'nothing');
  const knownStatuses: Record<string, DrawCardStatus> = {};
  const idsToFetch: string[] = [];

  for (const item of drawableItems) {
    if (item.multiplier !== undefined) {
      knownStatuses[item.id] = 'Done';
    } else {
      idsToFetch.push(item.id);
    }
  }

  return {
    knownStatuses,
    idsToFetch,
    fetchSignature: idsToFetch.join(','),
  };
}

export function useDrawCardStatuses(rewardHistory: RewardHistoryItem[]) {
  const { knownStatuses, idsToFetch, fetchSignature } = useMemo(
    () => buildStatusSnapshot(rewardHistory),
    [rewardHistory],
  );
  const [asyncStatuses, setAsyncStatuses] = useState<
    Record<string, DrawCardStatus>
  >({});
  const [loadedSignature, setLoadedSignature] = useState('');

  const isLoading =
    idsToFetch.length > 0 && loadedSignature !== fetchSignature;
  const pendingIds = useMemo(
    () => (isLoading ? new Set(idsToFetch) : new Set<string>()),
    [isLoading, idsToFetch],
  );
  const statuses = useMemo(
    () => ({
      ...knownStatuses,
      ...(loadedSignature === fetchSignature ? asyncStatuses : {}),
    }),
    [knownStatuses, asyncStatuses, loadedSignature, fetchSignature],
  );

  useEffect(() => {
    if (idsToFetch.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      idsToFetch.map(async (id) => {
        const state = await getUserJsonState<{ isGameOver?: boolean }>(
          `draw-card-state-${id}`,
        );

        const status: DrawCardStatus = !state
          ? 'Available'
          : state.isGameOver
            ? 'Done'
            : 'InProcess';

        return { id, status };
      }),
    ).then((results) => {
      if (cancelled) return;

      setAsyncStatuses(
        Object.fromEntries(results.map((result) => [result.id, result.status])),
      );
      setLoadedSignature(fetchSignature);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchSignature, idsToFetch]);

  const isItemPending = (id: string) => pendingIds.has(id);

  const setItemStatus = (id: string, status: DrawCardStatus) => {
    setAsyncStatuses((prev) => ({ ...prev, [id]: status }));
    setLoadedSignature(fetchSignature);
  };

  return {
    statuses,
    isLoading,
    isItemPending,
    setItemStatus,
  };
}
