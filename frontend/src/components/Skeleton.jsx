export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-surface-2 ${className}`} />
}

export function CardGridSkeleton({ count = 3, className = 'sm:grid-cols-2 lg:grid-cols-3', height = 'h-64' }) {
  return (
    <div role="status" aria-label="Loading content" className={`grid gap-6 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`rounded-2xl border border-line bg-surface p-5 ${height}`}>
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-4 h-8 w-2/3" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}