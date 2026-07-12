import { Skeleton } from './Skeleton';

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
};

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border">
      <table className="w-full border-collapse text-left">
        {showHeader && (
          <thead>
            <tr className="bg-secondary/30">
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-5 py-4">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="bg-card">
              {Array.from({ length: columns }).map((__, colIndex) => (
                <td key={colIndex} className="px-5 py-4">
                  <Skeleton
                    className={cnSkeletonCell(colIndex, columns)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cnSkeletonCell(index: number, total: number) {
  if (index === 0) return 'h-4 w-28';
  if (index === total - 1) return 'ml-auto h-9 w-24 rounded-xl';
  return 'h-4 w-24';
}
