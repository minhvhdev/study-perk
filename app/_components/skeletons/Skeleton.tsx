import { cn } from '@/app/_utils/app-cn.util';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/60',
        className,
      )}
      aria-hidden
    />
  );
}
