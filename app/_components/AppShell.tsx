'use client';

import { usePathname } from 'next/navigation';

import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

const AUTH_ROUTES = new Set(['/login']);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  if (isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-2 lg:p-6 overflow-auto h-full w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
