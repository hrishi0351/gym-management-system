import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

const STYLES = {
  error: 'border-danger/30 bg-danger-soft text-danger',
  success: 'border-success/30 bg-success-soft text-success',
  info: 'border-brand/30 bg-brand-soft text-brand',
}
const ICONS = { error: AlertCircle, success: CheckCircle2, info: Info }

export default function FormAlert({ variant = 'error', children }) {
  if (!children) return null
  const Icon = ICONS[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${STYLES[variant]}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}