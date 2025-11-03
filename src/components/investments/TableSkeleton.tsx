import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader dla tabeli inwestycji
 * Wyświetlany podczas ładowania danych
 */
export function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="grid grid-cols-5 gap-4 pb-3 border-b">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Row skeletons */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 py-4 border-b">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
