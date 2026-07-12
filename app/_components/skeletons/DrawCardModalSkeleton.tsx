import { Skeleton } from './Skeleton';

export function DrawCardModalSkeleton() {
  return (
    <div className="dark fixed inset-0 z-100 flex flex-col overflow-hidden bg-background/95 backdrop-blur-md text-foreground">
      <div className="flex items-start justify-between gap-4 border-b border-border/80 bg-card/40 px-5 py-4 md:px-8 md:py-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-11 w-11 rounded-2xl" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-40 pt-8">
        <div className="relative h-56 w-[min(100%,42rem)]">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="absolute left-1/2 top-1/2 h-52 w-36 -ml-[4.5rem] -mt-[6.5rem] md:h-56 md:w-40 md:-ml-20 md:-mt-28"
              style={{
                transform: `rotate(${(index - 3) * 12}deg) translateY(-${Math.abs(index - 3) * 28}px)`,
              }}
            >
              <Skeleton className="h-full w-full rounded-[1.25rem]" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-8 h-12 w-72 max-w-full rounded-2xl" />
      </div>

      <div className="border-t border-border/80 bg-card/95 px-4 py-4 md:px-8 md:py-5">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[7.5rem] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
