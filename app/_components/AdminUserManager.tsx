'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shield, UserPlus, Users } from 'lucide-react';

import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { useUIStore } from '@/app/_store';
import { useSession } from '@/app/_hooks/useSession';

type AdminListUser = {
  id: number;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
};

export function AdminUserManager() {
  const { language } = useUIStore();
  const { user } = useSession();
  const t = TRANSLATIONS[language].adminPage;

  const [users, setUsers] = useState<AdminListUser[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/users', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        const data = (await response.json()) as {
          error?: string;
          users?: AdminListUser[];
        };

        if (!response.ok) {
          if (!cancelled) {
            setError(data.error ?? t.loadError);
          }
          return;
        }

        if (!cancelled) {
          setUsers(data.users ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError(t.loadError);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [t.loadError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as {
        error?: string;
        user?: AdminListUser;
      };

      if (!response.ok) {
        setError(data.error ?? t.createError);
        return;
      }

      const createdUser = data.user;

      if (createdUser) {
        setUsers((prev) =>
          [...prev, createdUser].sort((left, right) =>
            left.username.localeCompare(right.username),
          ),
        );
      }

      setUsername('');
      setPassword('');
      setSuccess(t.createSuccess.replace('{username}', createdUser?.username ?? ''));
    } catch {
      setError(t.createError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[2rem] border border-border bg-linear-to-br from-primary/10 via-background to-purple-500/10 p-8 shadow-2xl shadow-primary/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
              <Shield size={14} />
              {t.badge}
            </div>
            <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
            <p className="max-w-2xl text-muted-foreground">{t.subtitle}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card/80 px-5 py-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              {t.signedInAs}
            </p>
            <p className="mt-2 text-lg font-black text-foreground">
              {user?.username ?? 'admin'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{t.createTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.createSubtitle}</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground" htmlFor="new-username">
                {t.usernameLabel}
              </label>
              <input
                id="new-username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t.usernamePlaceholder}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 outline-hidden transition focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground" htmlFor="new-password">
                {t.passwordLabel}
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.passwordPlaceholder}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 outline-hidden transition focus:ring-2 focus:ring-primary/20"
                minLength={8}
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-600">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? t.creating : t.createAction}
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-secondary p-3 text-foreground">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{t.listTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.listSubtitle}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-border bg-background px-4 py-12 text-center text-muted-foreground">
              {t.loading}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-secondary/30">
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      {t.tableUsername}
                    </th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      {t.tableRole}
                    </th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      {t.tableCreatedAt}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((entry) => (
                    <tr key={entry.id} className="bg-card">
                      <td className="px-5 py-4 font-bold text-foreground">
                        {entry.username}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-primary">
                          {entry.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="px-4 py-12 text-center text-muted-foreground">
                  {t.noUsers}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
