import { Inbox } from 'lucide-react'
import { Skeleton } from '../Skeleton.jsx'

/**
 * columns: [{ key, header, cell(row), className? }]
 * rows = null while the first load is running (skeleton); previous rows stay (dimmed) while reloading.
 */
export default function DataTable({
  columns,
  rows,
  rowKey = 'id',
  loading = false,
  caption,
  emptyTitle = 'No records found',
  emptyText = 'Try changing your search or filters.',
}) {
  const showSkeleton = loading && !rows
  const items = rows || []

  return (
    <div
      aria-busy={loading}
      className={`overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-opacity ${
        loading && rows ? 'opacity-60' : ''
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`px-4 py-3 font-semibold ${column.className || ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {showSkeleton ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4">
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <Inbox size={28} className="mx-auto text-muted" aria-hidden="true" />
                  <p className="mt-2 font-semibold">{emptyTitle}</p>
                  <p className="mt-1 text-sm text-muted">{emptyText}</p>
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row[rowKey]} className="hover:bg-surface-2/60">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 align-middle ${column.className || ''}`}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}