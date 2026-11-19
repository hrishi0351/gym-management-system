import { Skeleton } from '../Skeleton.jsx'
import { ErrorState } from '../StateViews.jsx'

function DefaultSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

/** state = result of useFetch (retry) or useResource (reload). children is a function that receives the data. */
export default function Boundary({ state, skeleton, children }) {
  const retry = state.reload ?? state.retry
  if (state.error) return <ErrorState error={state.error} onRetry={retry} />
  if (!state.data) return skeleton ?? <DefaultSkeleton />
  return children(state.data)
}