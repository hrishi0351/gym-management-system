import { useState } from 'react'
import StatusBadge from '../admin/StatusBadge.jsx'
import { formatDate } from '../../utils/adminFormat.js'
import { daysBetween, todayLocal } from '../../utils/dateTime.js'
import { formatCurrency } from '../../utils/format.js'

function Stat({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children}</dd>
    </div>
  )
}

function statusNote(m) {
  if (m.status === 'pending') {
    return m.amountPaid <= 0
      ? 'Your membership will activate after your first payment is recorded at the front desk.'
      : `Your membership will activate on ${formatDate(m.startDate)}.`
  }
  if (m.status === 'frozen') return 'Your membership is frozen. Please contact the front desk to resume it.'
  if (m.status === 'expired') return 'This membership has expired. Visit the front desk to renew it.'
  if (m.status === 'cancelled') return 'This membership was cancelled.'
  return null
}

export default function MembershipCard({ membership: m }) {
  const [today] = useState(todayLocal)
  const total = Math.max(daysBetween(m.startDate, m.expiryDate), 1)
  const elapsed = Math.min(Math.max(daysBetween(m.startDate, today), 0), total)
  const left = daysBetween(today, m.expiryDate)
  const percent = Math.round((elapsed / total) * 100)
  const note = statusNote(m)

  let leftText = `${left} ${left === 1 ? 'day' : 'days'} left`
  if (left < 0) leftText = 'Expired'
  else if (left === 0) leftText = 'Expires today'

  return (
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-muted">Your membership</p>
          <h2 className="font-display text-4xl font-extrabold uppercase text-brand">{m.planName}</h2>
          <p className="text-sm text-muted">{m.code}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={m.status} />
          <StatusBadge status={m.paymentStatus} />
        </div>
      </div>

      {m.status === 'active' && (
        <div className="mt-5">
          <div className="flex items-baseline justify-between text-sm">
            <span className={`font-semibold ${left <= 7 ? 'text-warning' : ''}`}>{leftText}</span>
            <span className="text-muted">{percent}% used</span>
          </div>
          <div
            role="progressbar"
            aria-label="Membership time used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2"
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      <dl className="mt-5 grid gap-4 sm:grid-cols-4">
        <Stat label="Starts">{formatDate(m.startDate)}</Stat>
        <Stat label="Expires">{formatDate(m.expiryDate)}</Stat>
        <Stat label="Paid">
          {formatCurrency(m.amountPaid)} <span className="font-normal text-muted">of {formatCurrency(m.amountTotal)}</span>
        </Stat>
        <Stat label="Balance due">
          <span className={m.balance > 0 ? 'font-semibold text-danger' : ''}>{formatCurrency(m.balance)}</span>
        </Stat>
      </dl>

      {note && <p className="mt-5 rounded-xl bg-surface-2 p-3 text-sm text-muted">{note}</p>}
      {m.balance > 0 && m.status !== 'cancelled' && (
        <p className="mt-3 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
          You have a balance of <strong>{formatCurrency(m.balance)}</strong>. Please pay it at the front desk.
        </p>
      )}
    </section>
  )
}