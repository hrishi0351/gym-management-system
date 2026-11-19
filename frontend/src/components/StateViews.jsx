import { AlertCircle, Inbox } from 'lucide-react'
import Button from './ui/Button.jsx'
import { getErrorMessage } from '../utils/errors.js'

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-danger/30 bg-danger-soft p-6 text-center">
      <AlertCircle size={28} className="mx-auto text-danger" aria-hidden="true" />
      <p className="mt-3 font-semibold text-danger">Could not load this section</p>
      <p className="mt-1 text-sm text-danger">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', text = 'Please check back soon.' }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
      <Inbox size={28} className="mx-auto text-muted" aria-hidden="true" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  )
}