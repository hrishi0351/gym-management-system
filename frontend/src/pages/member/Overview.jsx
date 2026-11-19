import { Link } from 'react-router-dom'
import { BadgeCheck, CalendarCheck, CalendarDays, TrendingUp } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import StatCard from '../../components/admin/StatCard.jsx'
import Boundary from '../../components/portal/Boundary.jsx'
import MembershipCard from '../../components/portal/MembershipCard.jsx'
import TrainerInfoCard from '../../components/portal/TrainerInfoCard.jsx'
import { buttonClasses } from '../../components/ui/buttonStyles.js'
import useAuth from '../../hooks/useAuth.js'
import useFetch from '../../hooks/useFetch.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchMyAttendance, fetchMyBookings, fetchMyMemberships, fetchMyProfile } from '../../services/portalService.js'
import { formatDate } from '../../utils/adminFormat.js'
import { formatTime } from '../../utils/format.js'

async function loadOverview() {
  const [profile, memberships, attendance, bookings] = await Promise.all([
    fetchMyProfile(),
    fetchMyMemberships(),
    fetchMyAttendance({ page: 1, limit: 1 }),
    fetchMyBookings({ upcoming: 'true', page: 1, limit: 3 }),
  ])
  return { profile, memberships, summary: attendance.meta, bookings: bookings.data }
}

export default function MemberOverview() {
  usePageTitle('My Dashboard')
  const { user } = useAuth()
  const state = useFetch(loadOverview)

  return (
    <>
      <PageHeading title={`Hi, ${user.firstName}`} subtitle="Your membership and activity at a glance." />

      <Boundary state={state}>
        {({ profile, memberships, summary, bookings }) => {
          const { current, history } = memberships
          const last = history[0]

          return (
            <div className="space-y-6">
              {current ? (
                <MembershipCard membership={current} />
              ) : (
                <section className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
                  <BadgeCheck size={32} className="mx-auto text-muted" aria-hidden="true" />
                  <h2 className="mt-2 font-display text-2xl font-bold uppercase">No active membership</h2>
                  <p className="mt-1 text-sm text-muted">
                    {last?.status === 'expired'
                      ? `Your ${last.planName} membership expired on ${formatDate(last.expiryDate)}. Visit the front desk to renew it.`
                      : 'Choose a plan to start training. Our team will set it up for you.'}
                  </p>
                  <Link to="/membership-registration" className={buttonClasses({ className: 'mt-4' })}>
                    Request a membership
                  </Link>
                </section>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={CalendarCheck} label="Visits this month" value={summary.thisMonth} to="/member/attendance" />
                <StatCard icon={TrendingUp} label="Last 30 days" value={summary.last30Days} tone="success" to="/member/attendance" />
                <StatCard icon={BadgeCheck} label="Total visits" value={summary.totalVisits} hint="Since you joined" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <TrainerInfoCard trainer={profile.trainer} />

                <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-2xl font-bold uppercase">Upcoming classes</h2>
                    <Link to="/member/classes" className="text-sm font-semibold text-brand hover:underline">
                      Book a class
                    </Link>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="mt-4 text-center">
                      <CalendarDays size={28} className="mx-auto text-muted" aria-hidden="true" />
                      <p className="mt-2 text-sm text-muted">You have no upcoming classes booked.</p>
                    </div>
                  ) : (
                    <ul className="mt-4 divide-y divide-line">
                      {bookings.map((b) => (
                        <li key={b.id} className="py-3">
                          <p className="font-semibold">{b.className}</p>
                          <p className="text-sm text-muted">
                            {formatDate(b.date)} · {formatTime(b.startTime)} – {formatTime(b.endTime)}
                            {b.location ? ` · ${b.location}` : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          )
        }}
      </Boundary>
    </>
  )
}