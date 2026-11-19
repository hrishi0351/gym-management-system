import { Link } from 'react-router-dom'

const TONES = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

export default function StatCard({ icon: Icon, label, value, hint, to, tone = 'brand' }) {
  const body = (
    <div className="flex items-start gap-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="font-display text-4xl font-extrabold leading-tight">{value}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  )
  const base = 'block rounded-2xl border border-line bg-surface p-5 shadow-sm'

  return to ? (
    <Link to={to} className={`${base} transition-colors hover:border-brand`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  )
}