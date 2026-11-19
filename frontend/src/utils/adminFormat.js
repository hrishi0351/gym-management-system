const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

function toDate(value) {
  if (!value) return null
  if (DATE_ONLY.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d) // a calendar date: no timezone shift
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'
}

export function formatDateTime(value) {
  const date = toDate(value)
  return date
    ? date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '–'
}

/** '2026-06' -> 'Jun 26' */
export function monthLabel(period) {
  const [y, m] = period.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
export const compactNumber = (n) => compact.format(Number(n) || 0)

export const fullName = (person) => `${person?.firstName ?? ''} ${person?.lastName ?? ''}`.trim()
export const statusLabel = (status) => String(status ?? '').replace(/_/g, ' ')

const GOOD = 'bg-success-soft text-success'
const WAIT = 'bg-warning-soft text-warning'
const BAD = 'bg-danger-soft text-danger'
const INFO = 'bg-brand-soft text-brand'
const OFF = 'bg-surface-2 text-muted'

export const STATUS_STYLES = {
  active: GOOD, paid: GOOD, completed: GOOD, converted: GOOD,
  pending: WAIT, partial: WAIT, new: WAIT,
  expired: BAD, failed: BAD, suspended: BAD, unpaid: BAD,
  frozen: INFO, contacted: INFO, refunded: INFO,
  cancelled: OFF, inactive: OFF, closed: OFF,
}
export const statusClass = (status) => STATUS_STYLES[status] || OFF