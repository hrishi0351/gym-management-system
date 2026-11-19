import { forwardRef, useId } from 'react'
import { inputClasses } from './inputStyles.js'

const Select = forwardRef(function Select({ label, error, hint, id, className = '', children, ...props }, ref) {
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
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={inputClasses(!!error)}
        {...props}
      >
        {children}
      </select>
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-sm text-danger">{error}</p>
      )}
    </div>
  )
})

export default Select