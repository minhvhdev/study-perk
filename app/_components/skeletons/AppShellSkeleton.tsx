import { StudyPageSkeleton } from './StudyPageSkeleton';
import { Skeleton } from './Skeleton';

export function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 z-50 flex h-screen w-20 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center justify-center border-b border-border">
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <div className="flex flex-1 flex-col items-center gap-3 py-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-11 rounded-2xl" />
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <Skeleton className="h-6 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-2 lg:p-6">
          <StudyPageSkeleton />
        </main>
      </div>
    </div>
  );
}
