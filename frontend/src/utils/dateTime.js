const toUtc = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10)

/** Today as YYYY-MM-DD in the browser's timezone */
export const todayLocal = () => new Date().toLocaleDateString('en-CA')

/** '2026-11-15' + 3 -> '2026-11-18' */
export const shiftDate = (date, days) => fromUtc(toUtc(date) + days * 86400000)

/** Whole days from a to b (b - a) */
export const daysBetween = (a, b) => Math.round((toUtc(b) - toUtc(a)) / 86400000)

/** Every date from `from` to `to`, inclusive */
export function eachDay(from, to) {
  const days = []
  for (let day = from; day <= to; day = shiftDate(day, 1)) days.push(day)
  return days
}

/** Every 'YYYY-MM' from the month of `from` to the month of `to`, inclusive */
export function eachMonth(from, to) {
  const months = []
  let [year, month] = from.slice(0, 7).split('-').map(Number)
  const [endYear, endMonth] = to.slice(0, 7).split('-').map(Number)
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return months
}

/** ISO timestamp -> "6:30 AM" */
export function formatClock(value) {
  if (!value) return '–'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '–' : date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

/** 65 -> "1h 05m", 40 -> "40m" */
export function formatMinutes(total) {
  if (total == null) return '–'
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return hours ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`
}