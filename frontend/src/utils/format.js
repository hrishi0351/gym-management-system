const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatCurrency = (amount) => inr.format(Number(amount) || 0)

/** 30 -> "1 month", 180 -> "6 months", 365 -> "1 year", 45 -> "45 days" */
export function formatDuration(days) {
  if (days % 365 === 0) {
    const years = days / 365
    return years === 1 ? '1 year' : `${years} years`
  }
  if (days % 30 === 0) {
    const months = days / 30
    return months === 1 ? '1 month' : `${months} months`
  }
  return `${days} days`
}

/** Monthly equivalent, only for plans of 2 months or longer */
export const perMonth = (price, days) => (days >= 60 ? Math.round(price / (days / 30)) : null)

export const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DAY_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** "18:30" -> "6:30 PM" */
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
}

export const DIFFICULTY = {
  beginner: { label: 'Beginner', className: 'bg-success-soft text-success' },
  intermediate: { label: 'Intermediate', className: 'bg-warning-soft text-warning' },
  advanced: { label: 'Advanced', className: 'bg-danger-soft text-danger' },
  all_levels: { label: 'All levels', className: 'bg-brand-soft text-brand' },
}

export const initials = (first = '', last = '') => `${first[0] || ''}${last[0] || ''}`.toUpperCase()

/** Up to `count` plans, popular first, then arranged so the popular one sits in the middle. */
export function pickFeaturedPlans(plans, count = 3) {
  const picked = [...plans].sort((a, b) => Number(b.isPopular) - Number(a.isPopular)).slice(0, count)
  return picked.length === 3 ? [picked[1], picked[0], picked[2]] : picked
}