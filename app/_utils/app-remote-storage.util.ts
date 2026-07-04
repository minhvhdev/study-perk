import { StateStorage } from 'zustand/middleware';

const memoryCache = new Map<string, string | null>();

async function requestState<T>(
  key: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/state/${encodeURIComponent(key)}`, {
    ...init,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Remote state request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const remoteStateStorage: StateStorage = {
  async getItem(name) {
    if (memoryCache.has(name)) {
      return memoryCache.get(name) ?? null;
    }

    try {
      const { value } = await requestState<{ value: string | null }>(name);
      memoryCache.set(name, value);
      return value;
    } catch {
      return null;
    }
  },

  async setItem(name, value) {
    memoryCache.set(name, value);
    await requestState(name, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  async removeItem(name) {
    memoryCache.delete(name);

    try {
      await requestState(name, {
        method: 'DELETE',
      });
    } catch {
      // Keep local state silent; auth middleware handles page access.
    }
  },
};

export async function getUserJsonState<T>(key: string) {
  const raw = await remoteStateStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setUserJsonState(key: string, value: unknown) {
  await remoteStateStorage.setItem(key, JSON.stringify(value));
}
