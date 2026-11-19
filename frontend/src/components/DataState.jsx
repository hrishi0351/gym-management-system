import { CardGridSkeleton } from './Skeleton.jsx'
import { EmptyState, ErrorState } from './StateViews.jsx'

/**
 * <DataState state={useFetchResult}>{(data) => <List items={data} />}</DataState>
 * Shows a skeleton while loading, an error with Retry, an empty message, or your content.
 */
export default function DataState({ state, skeleton, emptyTitle, emptyText, children }) {
  const { data, loading, error, retry } = state
  if (loading) return skeleton ?? <CardGridSkeleton />
  if (error) return <ErrorState error={error} onRetry={retry} />
  if (Array.isArray(data) && data.length === 0) return <EmptyState title={emptyTitle} text={emptyText} />
  return children(data)
}