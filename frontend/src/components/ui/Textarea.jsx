import { forwardRef, useId } from 'react'

const Textarea = forwardRef(function Textarea({ label, error, hint, id, className = '', rows = 5, ...props }, ref) {
  const autoId = useId()
  const fieldId = id || props.name || autoId
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined

  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-2 ${
          error
            ? 'border-danger focus:border-danger focus:ring-danger/30'
            : 'border-line focus:border-brand focus:ring-brand/30'
        }`}
        {...props}
      />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-sm text-danger">{error}</p>
      )}
    </div>
  )
})

export default Textarea