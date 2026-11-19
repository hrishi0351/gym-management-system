import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import useChartColors from '../../hooks/useChartColors.js'
import { compactNumber, monthLabel, statusLabel } from '../../utils/adminFormat.js'
import { formatCurrency } from '../../utils/format.js'

export function ChartCard({ title, subtitle, summary, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`}>
      <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      <div className="mt-4">{children}</div>
      {summary && <p className="sr-only">{summary}</p>}
    </section>
  )
}

const tooltipStyle = (c) => ({
  background: c.surface,
  border: `1px solid ${c.grid}`,
  borderRadius: 12,
  color: c.fg,
  fontSize: 13,
})

export function RevenueChart({ data }) {
  const c = useChartColors()
  const rows = data.map((d) => ({ label: monthLabel(d.period), revenue: d.revenue }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: c.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: c.text, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={compactNumber} width={48} />
          <Tooltip
            cursor={{ fill: c.grid, opacity: 0.4 }}
            contentStyle={tooltipStyle(c)}
            labelStyle={{ color: c.fg }}
            formatter={(value) => [formatCurrency(value), 'Revenue']}
          />
          <Bar dataKey="revenue" fill={c.brand} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MembersChart({ data }) {
  const c = useChartColors()
  const rows = data.map((d) => ({ label: monthLabel(d.period), members: d.members }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: c.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: c.text, fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle(c)} labelStyle={{ color: c.fg }} formatter={(value) => [value, 'New members']} />
          <Line type="monotone" dataKey="members" stroke={c.brand} strokeWidth={3} dot={{ r: 4, fill: c.brand }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatusChart({ data }) {
  const c = useChartColors()
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) return <p className="py-10 text-center text-sm text-muted">No memberships yet.</p>

  const rows = data.map((d) => ({ name: statusLabel(d.status), status: d.status, value: d.count }))

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={2} stroke="none">
              {rows.map((row) => (
                <Cell key={row.status} fill={c.status[row.status] || c.text} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle(c)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {rows.map((row) => (
          <li key={row.status} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 capitalize">
              <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: c.status[row.status] || c.text }} />
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