import { Link } from 'react-router-dom'
import {
  AlertCircle, BadgeCheck, CalendarCheck, Clock, Dumbbell, Inbox, IndianRupee, Mail, Users, Wallet,
} from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import StatCard from '../../components/admin/StatCard.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { ChartCard, MembersChart, RevenueChart, StatusChart } from '../../components/admin/DashboardCharts.jsx'
import { Skeleton } from '../../components/Skeleton.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useAuth from '../../hooks/useAuth.js'
import useFetch from '../../hooks/useFetch.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchDashboard } from '../../services/adminService.js'
import { formatDate, fullName, monthLabel } from '../../utils/adminFormat.js'
import { formatCurrency } from '../../utils/format.js'

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  )
}

function Panel({ title, action, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

const seeAll = (to) => (
  <Link to={to} className="text-sm font-semibold text-brand hover:underline">
    View all
  </Link>
)

export default function AdminDashboard() {
  usePageTitle('Admin Dashboard')
  const { user } = useAuth()
  const dashboard = useFetch(fetchDashboard)

  let content
  if (dashboard.loading) {
    content = <DashboardSkeleton />
  } else if (dashboard.error) {
    content = <ErrorState error={dashboard.error} onRetry={dashboard.retry} />
  } else {
    const { stats: s, charts, expiringSoon, recentPayments, recentMembers } = dashboard.data
    const revenueSummary = charts.revenueByMonth.map((d) => `${monthLabel(d.period)} ${formatCurrency(d.revenue)}`).join(', ')
    const membersSummary = charts.newMembersByMonth.map((d) => `${monthLabel(d.period)} ${d.members}`).join(', ')

    content = (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} label="Total members" value={s.totalMembers} hint="Registered members" to="/admin/members" />
          <StatCard icon={BadgeCheck} label="Active memberships" value={s.activeMemberships} hint={`${s.pendingMemberships} pending`} to="/admin/memberships" tone="success" />
          <StatCard icon={AlertCircle} label="Expired memberships" value={s.expiredMemberships} hint="Ready for renewal" to="/admin/memberships" tone="danger" />
          <StatCard icon={Dumbbell} label="Trainers" value={s.totalTrainers} hint="On the team" to="/admin/trainers" />
          <StatCard icon={IndianRupee} label="Total revenue" value={formatCurrency(s.totalRevenue)} hint="All completed payments" to="/admin/payments" tone="success" />
          <StatCard icon={Wallet} label="Revenue this month" value={formatCurrency(s.revenueThisMonth)} hint="Completed payments" to="/admin/payments" />
          <StatCard icon={CalendarCheck} label="Check-ins today" value={s.todayCheckIns} hint={`${s.currentlyInGym} in the gym now`} to="/admin/attendance" />
          <StatCard icon={Clock} label="Expiring in 7 days" value={s.expiringSoon} hint="Memberships ending soon" to="/admin/memberships" tone="warning" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/admin/enquiries" className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-brand">
            <Inbox size={16} className="text-brand" aria-hidden="true" />
            {s.newEnquiries} new {s.newEnquiries === 1 ? 'enquiry' : 'enquiries'}
          </Link>
          <Link to="/admin/messages" className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-brand">
            <Mail size={16} className="text-brand" aria-hidden="true" />
            {s.unreadMessages} unread {s.unreadMessages === 1 ? 'message' : 'messages'}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Revenue" subtitle="Completed payments, last 6 months" summary={`Revenue by month: ${revenueSummary}`}>
            <RevenueChart data={charts.revenueByMonth} />
          </ChartCard>
          <ChartCard title="New members" subtitle="Joined per month, last 6 months" summary={`New members by month: ${membersSummary}`}>
            <MembersChart data={charts.newMembersByMonth} />
          </ChartCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Memberships" subtitle="By status">
            <StatusChart data={charts.membershipStatus} />
          </ChartCard>

          <Panel title="Expiring soon" action={seeAll('/admin/memberships')}>
            {expiringSoon.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No memberships expire in the next 7 days.</p>
            ) : (
              <ul className="divide-y divide-line">
                {expiringSoon.map((item) => (
                  <li key={item.membershipId} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link to={`/admin/members/${item.memberId}`} className="font-semibold hover:text-brand">
                        {item.memberName}
                      </Link>
                      <p className="text-xs text-muted">
                        {item.planName} · {item.memberCode}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-warning">
                        {item.daysLeft === 0 ? 'Today' : `${item.daysLeft} ${item.daysLeft === 1 ? 'day' : 'days'} left`}
                      </p>
                      <p className="text-xs text-muted">{formatDate(item.expiryDate)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Recent payments" action={seeAll('/admin/payments')}>
            {recentPayments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {recentPayments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{p.memberName}</p>
                      <p className="text-xs text-muted">
                        {p.receiptNo} · {formatDate(p.paidAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-semibold">{formatCurrency(p.amount)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="New members" action={seeAll('/admin/members')}>
            {recentMembers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No members yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {recentMembers.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link to={`/admin/members/${m.id}`} className="font-semibold hover:text-brand">
                        {fullName(m)}
                      </Link>
                      <p className="text-xs text-muted">
                        {m.memberCode} · joined {formatDate(m.joinedOn)}
                      </p>
                    </div>
                    {m.membership ? <StatusBadge status={m.membership.status} /> : <span className="text-xs text-muted">No membership</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeading title="Dashboard" subtitle={`Welcome back, ${user.firstName}. Here is how the gym is doing.`} />
      {content}
    </>
  )
}