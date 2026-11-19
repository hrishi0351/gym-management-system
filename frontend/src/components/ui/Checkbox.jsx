import { forwardRef } from 'react'

const Checkbox = forwardRef(function Checkbox({ label, hint, id, className = '', ...props }, ref) {
  const fieldId = id || props.name
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input ref={ref} id={fieldId} type="checkbox" className="mt-0.5 h-4 w-4 cursor-pointer accent-brand" {...props} />
        <span>
          <span className="font-medium text-fg">{label}</span>
          {hint && <span className="block text-xs text-muted">{hint}</span>}
        </span>
      </label>
    </div>
  )
})

export default Checkbox