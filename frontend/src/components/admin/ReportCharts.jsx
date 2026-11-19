import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import useChartColors from '../../hooks/useChartColors.js'
import { compactNumber, monthLabel } from '../../utils/adminFormat.js'
import { methodLabel } from '../../utils/adminOptions.js'
import { eachDay, eachMonth } from '../../utils/dateTime.js'
import { formatCurrency } from '../../utils/format.js'

const dayLabel = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`
const hourFull = (h) => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`

const tooltipStyle = (c) => ({
  background: c.surface,
  border: `1px solid ${c.grid}`,
  borderRadius: 12,
  color: c.fg,
  fontSize: 13,
})

function SimpleBars({ rows, dataKey, valueName, formatValue, tickInterval }) {
  const c = useChartColors()
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: c.text, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval ?? 'preserveStartEnd'}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: c.text, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={compactNumber}
            width={44}
          />
          <Tooltip
            cursor={{ fill: c.grid, opacity: 0.4 }}
            contentStyle={tooltipStyle(c)}
            labelStyle={{ color: c.fg }}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.full ?? label}
            formatter={(value) => [formatValue ? formatValue(value) : value, valueName]}
          />
          <Bar dataKey={dataKey} fill={c.brand} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** series: [{ period, total }] where period is 'YYYY-MM-DD' (day) or 'YYYY-MM' (month) */
export function RevenueSeriesChart({ data, from, to, groupBy }) {
  const keys = groupBy === 'month' ? eachMonth(from, to) : eachDay(from, to)
  const byPeriod = new Map(data.map((d) => [d.period, d.total]))
  const rows = keys.map((key) => ({
    label: groupBy === 'month' ? monthLabel(key) : dayLabel(key),
    total: byPeriod.get(key) ?? 0,
  }))
  return <SimpleBars rows={rows} dataKey="total" valueName="Revenue" formatValue={formatCurrency} />
}

/** daily: [{ date, checkIns }] */
export function AttendanceDailyChart({ data, from, to }) {
  const byDate = new Map(data.map((d) => [d.date, d.checkIns]))
  const rows = eachDay(from, to).map((day) => ({ label: dayLabel(day), checkIns: byDate.get(day) ?? 0 }))
  return <SimpleBars rows={rows} dataKey="checkIns" valueName="Check-ins" />
}

/** byHour: [{ hour, checkIns }] */
export function HourChart({ data }) {
  const byHour = new Map(data.map((d) => [d.hour, d.checkIns]))
  const rows = Array.from({ length: 24 }, (_, hour) => ({
    label: hourLabel(hour),
    full: hourFull(hour),
    checkIns: byHour.get(hour) ?? 0,
  }))
  return <SimpleBars rows={rows} dataKey="checkIns" valueName="Check-ins" tickInterval={1} />
}

/** rows: [{ key, name, value }] */
export function DonutBreakdown({ rows, emptyText = 'No data yet.' }) {
  const c = useChartColors()
  const palette = [c.brand, c.status.frozen, c.status.active, c.status.pending, c.status.expired, c.text]
  const total = rows.reduce((sum, row) => sum + row.value, 0)

  if (total === 0) return <p className="py-10 text-center text-sm text-muted">{emptyText}</p>

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={2} stroke="none">
              {rows.map((row, i) => (
                <Cell key={row.key} fill={palette[i % palette.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle(c)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {rows.map((row, i) => (
          <li key={row.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 capitalize">
              <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: palette[i % palette.length] }} />
              {row.name}
            </span>
            <span className="font-semibold">
              {row.value} <span className="font-normal text-muted">({Math.round((row.value / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** data: [{ method, payments, total }]. Plain CSS bars, so it works as text for screen readers too. */
export function MethodBreakdown({ data }) {
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted">No payments in this period.</p>
  const max = Math.max(...data.map((d) => d.total), 1)

  return (
    <ul className="space-y-4">
      {data.map((d) => (
        <li key={d.method}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>
              {methodLabel(d.method)}{' '}
              <span className="text-muted">
                · {d.payments} {d.payments === 1 ? 'payment' : 'payments'}
              </span>
            </span>
            <span className="font-semibold">{formatCurrency(d.total)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(d.total / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}