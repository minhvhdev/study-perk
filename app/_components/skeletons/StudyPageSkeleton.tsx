import { Skeleton } from './Skeleton';

export function StudyPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[3rem] border border-border/50 bg-card/30 py-6">
          <Skeleton className="h-72 w-72 rounded-full" />
          <Skeleton className="mt-6 h-14 w-40 rounded-2xl" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[2rem] border border-border bg-card p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-10 w-24" />
            <Skeleton className="mt-6 h-11 w-full rounded-2xl" />
          </div>
          <div className="rounded-[2rem] border border-border bg-card p-6">
            <Skeleton className="h-5 w-40" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6">
          <Skeleton className="h-5 w-36" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-border bg-card p-6">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-6 h-56 w-full rounded-2xl" />
      </div>
    </div>
  );
}
