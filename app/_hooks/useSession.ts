'use client';

import { useEffect, useState } from 'react';

type SessionUser = {
  id: number;
  username: string;
  role: 'admin' | 'user';
};

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const data = (await response.json()) as {
          user?: SessionUser | null;
        };

        if (!cancelled) {
          setUser(data.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    user,
    isLoading,
    isAdmin: user?.role === 'admin',
  };
}
