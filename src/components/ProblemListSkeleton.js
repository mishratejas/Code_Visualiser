export function ProblemListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading problems">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          {/* Difficulty indicator skeleton */}
          <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
          
          {/* Title skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
          
          {/* Language icon skeleton */}
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
          
          {/* Timestamp skeleton */}
          <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
      <span className="sr-only">Loading problem list...</span>
    </div>
  );
}

export function ProblemCardSkeleton() {
  return (
    <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
        <div className="h-6 w-16 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-14 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="h-6 w-14 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
