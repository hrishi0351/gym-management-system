import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck, CalendarCheck, Download, IndianRupee, Receipt, RotateCcw, Timer, UserPlus, Users, Wallet,
} from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import StatCard from '../../components/admin/StatCard.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import RangeControls from '../../components/admin/RangeControls.jsx'
import { ChartCard, MembersChart, StatusChart } from '../../components/admin/DashboardCharts.jsx'
import {
  AttendanceDailyChart, DonutBreakdown, HourChart, MethodBreakdown, RevenueSeriesChart,
} from '../../components/admin/ReportCharts.jsx'
import Tabs from '../../components/ui/Tabs.jsx'
import Select from '../../components/ui/Select.jsx'
import Button from '../../components/ui/Button.jsx'
import { Skeleton } from '../../components/Skeleton.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDateRange from '../../hooks/useDateRange.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import useResource from '../../hooks/useResource.js'
import {
  fetchAttendanceReport, fetchMembersReport, fetchMembershipsReport, fetchRevenueReport,
} from '../../services/adminService.js'
import { formatDate, statusLabel } from '../../utils/adminFormat.js'
import { downloadCsv } from '../../utils/csv.js'
import { daysBetween, eachMonth, formatMinutes } from '../../utils/dateTime.js'
import { formatCurrency } from '../../utils/format.js'

// Loaders must be stable functions (defined outside components). The key carries the parameters.
const loadRevenue = (key) => {
  const [from, to, groupBy] = key.split('|')
  return fetchRevenueReport({ from, to, groupBy })
}
const loadAttendance = (key) => {
  const [from, to] = key.split('|')
  return fetchAttendanceReport({ from, to })
}
const loadMembers = (key) => {
  const [from, to] = key.split('|')
  return fetchMembersReport({ from, to })
}

function ReportSkeleton() {
  return (
    <div role="status" aria-label="Loading report" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

function ReportBody({ resource, children }) {
  if (resource.error) return <ErrorState error={resource.error} onRetry={resource.reload} />
  if (!resource.data) return <ReportSkeleton />
  return children(resource.data)
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function ExportButton({ onClick, disabled }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick} disabled={disabled}>
      <Download size={15} aria-hidden="true" /> Export CSV
    </Button>
  )
}

const memberLink = (id, name) => (
  <Link to={`/admin/members/${id}`} className="font-semibold hover:text-brand">
    {name}
  </Link>
)

// ============================================================ Revenue
function RevenueReport({ from, to, groupBy }) {
  const resource = useResource(loadRevenue, `${from}|${to}|${groupBy}`)

  return (
    <ReportBody resource={resource}>
      {(r) => {
        const average = r.totalPayments ? r.totalRevenue / r.totalPayments : 0
        const exportCsv = () =>
          downloadCsv(
            `revenue-${r.from}-to-${r.to}.csv`,
            [groupBy === 'month' ? 'Month' : 'Date', 'Payments', 'Revenue (INR)'],
            r.series.map((s) => [s.period, s.payments, s.total])
          )

        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={IndianRupee} label="Revenue" value={formatCurrency(r.totalRevenue)} hint="Completed payments" tone="success" />
              <StatCard icon={Receipt} label="Payments" value={r.totalPayments} hint="Completed" />
              <StatCard icon={Wallet} label="Average payment" value={formatCurrency(average)} />
              <StatCard icon={RotateCcw} label="Refunded" value={formatCurrency(r.refundedTotal)} hint="Not counted in revenue" tone="warning" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <ChartCard
                title={`Revenue by ${groupBy}`}
                subtitle={groupBy === 'day' && daysBetween(r.from, r.to) > 120 ? 'Tip: group by month for long periods.' : undefined}
                summary={`Total revenue ${formatCurrency(r.totalRevenue)} from ${r.totalPayments} payments.`}
                className="lg:col-span-2"
              >
                <RevenueSeriesChart data={r.series} from={r.from} to={r.to} groupBy={groupBy} />
              </ChartCard>
              <ChartCard title="By payment method">
                <MethodBreakdown data={r.byMethod} />
              </ChartCard>
            </div>

            <div className="flex justify-end">
              <ExportButton onClick={exportCsv} disabled={r.series.length === 0} />
            </div>
          </div>
        )
      }}
    </ReportBody>
  )
}

function RevenueTab() {
  const range = useDateRange('30d')
  const [groupBy, setGroupBy] = useState('day')

  return (
    <>
      <RangeControls range={range}>
        <Select label="Group by" value={groupBy} onChange={(event) => setGroupBy(event.target.value)} className="w-36">
          <option value="day">Day</option>
          <option value="month">Month</option>
        </Select>
      </RangeControls>
      {!range.error && <RevenueReport from={range.from} to={range.to} groupBy={groupBy} />}
    </>
  )
}

// ============================================================ Memberships
const PLAN_COLUMNS = [
  { key: 'plan', header: 'Plan', cell: (p) => <span className="font-semibold">{p.name}</span> },
  { key: 'total', header: 'Memberships sold', cell: (p) => p.memberships },
  { key: 'active', header: 'Active now', cell: (p) => p.active },
  { key: 'revenue', header: 'Revenue collected', cell: (p) => formatCurrency(p.revenue) },
]

const DUES_COLUMNS = [
  {
    key: 'member',
    header: 'Member',
    cell: (d) => (
      <div>
        <p className="font-semibold">{d.memberName}</p>
        <p className="text-xs text-muted">
          {d.memberCode} · {d.phone || 'No phone'}
        </p>
      </div>
    ),
  },
  { key: 'membership', header: 'Membership', cell: (d) => d.membershipCode },
  { key: 'total', header: 'Total', cell: (d) => formatCurrency(d.amountTotal) },
  { key: 'paid', header: 'Paid', cell: (d) => formatCurrency(d.paid) },
  { key: 'due', header: 'Due', cell: (d) => <span className="font-semibold text-danger">{formatCurrency(d.due)}</span> },
]

const EXPIRING_COLUMNS = [
  {
    key: 'member',
    header: 'Member',
    cell: (e) => (
      <div>
        {memberLink(e.memberId, e.memberName)}
        <p className="text-xs text-muted">
          {e.memberCode} · {e.phone || 'No phone'}
        </p>
      </div>
    ),
  },
  { key: 'plan', header: 'Plan', cell: (e) => e.planName },
  { key: 'expiry', header: 'Expires', cell: (e) => formatDate(e.expiryDate) },
  {
    key: 'left',
    header: 'Days left',
    cell: (e) => <span className="font-semibold text-warning">{e.daysLeft === 0 ? 'Today' : e.daysLeft}</span>,
  },
]

function MembershipsTab() {
  const resource = useResource(fetchMembershipsReport, 'memberships')

  return (
    <ReportBody resource={resource}>
      {(r) => {
        const totalDue = r.outstandingDues.reduce((sum, d) => sum + d.due, 0)
        const exportDues = () =>
          downloadCsv(
            'outstanding-dues.csv',
            ['Member', 'Member code', 'Phone', 'Membership', 'Total (INR)', 'Paid (INR)', 'Due (INR)'],
            r.outstandingDues.map((d) => [d.memberName, d.memberCode, d.phone, d.membershipCode, d.amountTotal, d.paid, d.due])
          )

        return (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={BadgeCheck} label="Active memberships" value={r.statusCounts.find((s) => s.status === 'active')?.count ?? 0} tone="success" />
              <StatCard icon={Wallet} label="Outstanding dues" value={formatCurrency(totalDue)} hint={`${r.outstandingDues.length} memberships`} tone="danger" />
              <StatCard icon={Timer} label="Expiring in 30 days" value={r.expiringIn30Days.length} tone="warning" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Memberships by status">
                <StatusChart data={r.statusCounts} />
              </ChartCard>
              <section>
                <SectionTitle title="Plans" subtitle="Sales and revenue per plan" />
                <DataTable caption="Plans overview" columns={PLAN_COLUMNS} rows={r.byPlan} rowKey="planId" emptyTitle="No plans yet" />
              </section>
            </div>

            <section>
              <SectionTitle
                title="Outstanding dues"
                subtitle="Memberships with a balance still to collect (largest 50)."
                action={<ExportButton onClick={exportDues} disabled={r.outstandingDues.length === 0} />}
              />
              <DataTable
                caption="Outstanding dues"
                columns={DUES_COLUMNS}
                rows={r.outstandingDues}
                rowKey="membershipId"
                emptyTitle="No dues"
                emptyText="Every membership is fully paid."
              />
            </section>

            <section>
              <SectionTitle title="Expiring in the next 30 days" subtitle="Good members to call about a renewal." />
              <DataTable
                caption="Memberships expiring soon"
                columns={EXPIRING_COLUMNS}
                rows={r.expiringIn30Days}
                rowKey="membershipId"
                emptyTitle="Nothing expires soon"
                emptyText="No active membership ends in the next 30 days."
              />
            </section>
          </div>
        )
      }}
    </ReportBody>
  )
}

// ============================================================ Attendance
const TOP_COLUMNS = [
  { key: 'rank', header: '#', cell: (m) => m.rank },
  {
    key: 'member',
    header: 'Member',
    cell: (m) => (
      <div>
        {memberLink(m.memberId, m.memberName)}
        <p className="text-xs text-muted">{m.memberCode}</p>
      </div>
    ),
  },
  { key: 'visits', header: 'Visits', cell: (m) => <span className="font-semibold">{m.visits}</span> },
]

function AttendanceReport({ from, to }) {
  const resource = useResource(loadAttendance, `${from}|${to}`)

  return (
    <ReportBody resource={resource}>
      {(r) => {
        const peak = [...r.byHour].sort((a, b) => b.checkIns - a.checkIns)[0]
        const peakLabel = peak ? `${peak.hour % 12 || 12} ${peak.hour < 12 ? 'AM' : 'PM'}` : '–'
        const top = r.topMembers.map((m, i) => ({ ...m, rank: i + 1 }))
        const exportCsv = () =>
          downloadCsv(`attendance-${r.from}-to-${r.to}.csv`, ['Date', 'Check-ins'], r.daily.map((d) => [d.date, d.checkIns]))

        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={CalendarCheck} label="Check-ins" value={r.totalCheckIns} hint="In this period" />
              <StatCard icon={Users} label="Unique members" value={r.uniqueMembers} tone="success" />
              <StatCard icon={Timer} label="Average visit" value={formatMinutes(r.averageVisitMinutes)} hint="Only visits with check-out" />
              <StatCard icon={CalendarCheck} label="Busiest hour" value={peakLabel} hint="Most check-ins" tone="warning" />
            </div>

            <ChartCard title="Daily check-ins" summary={`${r.totalCheckIns} check-ins by ${r.uniqueMembers} members.`}>
              <AttendanceDailyChart data={r.daily} from={r.from} to={r.to} />
            </ChartCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Check-ins by hour" subtitle="Local time of day">
                <HourChart data={r.byHour} />
              </ChartCard>
              <section>
                <SectionTitle title="Most regular members" subtitle="Top 10 by visits" />
                <DataTable caption="Top members by visits" columns={TOP_COLUMNS} rows={top} rowKey="memberId" emptyTitle="No visits in this period" />
              </section>
            </div>

            <div className="flex justify-end">
              <ExportButton onClick={exportCsv} disabled={r.daily.length === 0} />
            </div>
          </div>
        )
      }}
    </ReportBody>
  )
}

function AttendanceTab() {
  const range = useDateRange('30d')
  return (
    <>
      <RangeControls range={range} />
      {!range.error && <AttendanceReport from={range.from} to={range.to} />}
    </>
  )
}

// ============================================================ Members
function MembersReport({ from, to }) {
  const resource = useResource(loadMembers, `${from}|${to}`)

  return (
    <ReportBody resource={resource}>
      {(r) => {
        const byMonth = new Map(r.newByMonth.map((d) => [d.period, d.members]))
        const newMembers = eachMonth(r.from, r.to).map((period) => ({ period, members: byMonth.get(period) ?? 0 }))
        const genderRows = r.gender.map((g) => ({ key: g.gender, name: g.gender === 'unknown' ? 'Not specified' : g.gender, value: g.count }))
        const statusRows = r.accountStatus.map((s) => ({ key: s.status, name: statusLabel(s.status), value: s.count }))

        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard icon={UserPlus} label="New members" value={r.totalNewMembers} hint="Joined in this period" tone="success" />
              <StatCard icon={Users} label="Members today" value={statusRows.reduce((sum, s) => sum + s.value, 0)} hint="All current members" />
            </div>

            <ChartCard title="New members per month" summary={`${r.totalNewMembers} members joined in this period.`}>
              <MembersChart data={newMembers} />
            </ChartCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Gender" subtitle="All current members">
                <DonutBreakdown rows={genderRows} emptyText="No members yet." />
              </ChartCard>
              <ChartCard title="Account status" subtitle="All current members">
                <DonutBreakdown rows={statusRows} emptyText="No members yet." />
              </ChartCard>
            </div>
          </div>
        )
      }}
    </ReportBody>
  )
}

function MembersTab() {
  const range = useDateRange('365d')
  return (
    <>
      <RangeControls range={range} />
      {!range.error && <MembersReport from={range.from} to={range.to} />}
    </>
  )
}

// ============================================================ Page
const TABS = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'memberships', label: 'Memberships' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'members', label: 'Members' },
]

export default function Reports() {
  usePageTitle('Reports')
  const [tab, setTab] = useState('revenue')

  return (
    <>
      <PageHeading title="Reports" subtitle="Revenue, memberships, attendance and member growth." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Report type" idPrefix="reports" />

      <div role="tabpanel" id="reports-panel" aria-labelledby={`reports-tab-${tab}`}>
        {tab === 'revenue' && <RevenueTab />}
        {tab === 'memberships' && <MembershipsTab />}
        {tab === 'attendance' && <AttendanceTab />}
        {tab === 'members' && <MembersTab />}
      </div>
    </>
  )
}