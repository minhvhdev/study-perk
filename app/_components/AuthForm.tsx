'use client';

import { FormEvent, useState } from 'react';
import { Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useUIStore } from '@/app/_store';
import { TRANSLATIONS } from '@/app/_constants/app-translations.constant';
import { useHydrated } from '@/app/_hooks/useHydrated';

type LoginResponse = {
  error?: string;
  user?: {
    role: 'admin' | 'user';
  };
};

export function AuthForm() {
  const hydrated = useHydrated();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useUIStore();
  const t = TRANSLATIONS[language].auth;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.error ?? t.genericError);
        return;
      }

      window.location.assign(data.user?.role === 'admin' ? '/admin' : '/');
    } catch {
      setError(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-background text-foreground" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto flex max-w-6xl justify-end gap-3 pb-6">
        <button
          onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold shadow-sm"
        >
          <Globe size={16} className="text-primary" />
          <span className="uppercase">{language}</span>
        </button>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full border border-border bg-card p-2.5 text-muted-foreground shadow-sm"
        >
          <span className="dark:hidden">
            <Moon size={16} />
          </span>
          <span className="hidden dark:inline">
            <Sun size={16} />
          </span>
        </button>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-border bg-linear-to-br from-primary/10 via-background to-purple-500/10 p-8 shadow-2xl shadow-primary/5">
          <div className="max-w-xl space-y-5">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-primary">
              Study Perk
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground">{t.heroDescription}</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-2xl">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-black tracking-tight">{t.loginTitle}</h2>
            <p className="text-muted-foreground">{t.loginSubtitle}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground" htmlFor="username">
                {t.usernameLabel}
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t.usernamePlaceholder}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 outline-hidden transition focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-bold text-muted-foreground"
                htmlFor="password"
              >
                {t.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.passwordPlaceholder}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 outline-hidden transition focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? t.submitting : t.loginAction}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
