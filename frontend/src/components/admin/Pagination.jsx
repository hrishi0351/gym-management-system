import { ChevronLeft, ChevronRight } from 'lucide-react'

const BTN =
  'inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.total === 0) return null
  const { page, limit, total, totalPages } = meta
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const pages = []
  for (let p = start; p <= end; p += 1) pages.push(p)

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={`${BTN} border-line bg-surface text-fg hover:bg-surface-2`}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
            className={`${BTN} ${
              p === page ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-fg hover:bg-surface-2'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={`${BTN} border-line bg-surface text-fg hover:bg-surface-2`}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}