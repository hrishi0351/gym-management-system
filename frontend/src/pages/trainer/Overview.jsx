import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CalendarDays, Clock, Users } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import StatCard from '../../components/admin/StatCard.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import Boundary from '../../components/portal/Boundary.jsx'
import WeeklyTimetable from '../../components/WeeklyTimetable.jsx'
import useAuth from '../../hooks/useAuth.js'
import useFetch from '../../hooks/useFetch.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchTrainerClasses, fetchTrainerMembers, fetchTrainerProfile } from '../../services/portalService.js'
import { formatDate, fullName } from '../../utils/adminFormat.js'
import { formatTime } from '../../utils/format.js'

async function loadOverview() {
  const [profile, members, classes] = await Promise.all([
    fetchTrainerProfile(),
    fetchTrainerMembers({ page: 1, limit: 100 }),
    fetchTrainerClasses(),
  ])
  return { profile, members: members.data, totalMembers: members.meta.total, classes }
}

const isoWeekdayNow = () => {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

export default function TrainerOverview() {
  usePageTitle('Trainer Dashboard')
  const { user } = useAuth()
  const state = useFetch(loadOverview)
  const [todayIso] = useState(isoWeekdayNow)

  return (
    <>
      <PageHeading title={`Hi, ${user.firstName}`} subtitle="Your day, your members and your classes." />

      <Boundary state={state}>
        {({ members, totalMembers, classes }) => {
          const active = classes.filter((c) => c.isActive)
          const sessionsToday = active
            .flatMap((c) =>
              c.schedules
                .filter((s) => s.dayOfWeek === todayIso)
                .map((s) => ({ id: s.id, name: c.name, location: c.location, capacity: c.capacity, startTime: s.startTime, endTime: s.endTime }))
            )
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
          const weeklySlots = active.reduce((sum, c) => sum + c.schedules.length, 0)
          const followUp = members.filter((m) => m.membershipStatus !== 'active')

          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Users} label="Assigned members" value={totalMembers} to="/trainer/members" />
                <StatCard icon={CalendarDays} label="Active classes" value={active.length} to="/trainer/classes" tone="success" />
                <StatCard icon={Clock} label="Weekly sessions" value={weeklySlots} hint="Time slots per week" />
                <StatCard icon={AlertCircle} label="Need follow-up" value={followUp.length} hint="No active membership" tone="warning" to="/trainer/members" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                  <h2 className="font-display text-2xl font-bold uppercase">Today&apos;s sessions</h2>
                  {sessionsToday.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">You have no classes scheduled today.</p>
                  ) : (
                    <ul className="mt-4 divide-y divide-line">
                      {sessionsToday.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-sm text-muted">{s.location || 'No location set'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-brand">
                              {formatTime(s.startTime)} – {formatTime(s.endTime)}
                            </p>
                            <p className="text-xs text-muted">Up to {s.capacity}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link to="/trainer/classes" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
                    Manage classes and bookings
                  </Link>
                </section>

                <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                  <h2 className="font-display text-2xl font-bold uppercase">Members to follow up</h2>
                  <p className="text-sm text-muted">Assigned members whose membership is not active.</p>
                  {followUp.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">Everyone assigned to you has an active membership.</p>
                  ) : (
                    <ul className="mt-4 divide-y divide-line">
                      {followUp.slice(0, 5).map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                          <div>
                            <p className="font-semibold">{fullName(m)}</p>
                            <p className="text-xs text-muted">
                              {m.memberCode}
                              {m.expiryDate ? ` · expired ${formatDate(m.expiryDate)}` : ''}
                            </p>
                          </div>
                          {m.membershipStatus ? <StatusBadge status={m.membershipStatus} /> : <span className="text-xs text-muted">No membership</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <section>
                <h2 className="mb-3 font-display text-2xl font-bold uppercase">My weekly timetable</h2>
                {weeklySlots === 0 ? (
                  <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
                    No weekly time slots yet. Add them from My classes.
                  </p>
                ) : (
                  <WeeklyTimetable classes={active.map((c) => ({ ...c, trainer: null }))} />
                )}
              </section>
            </div>
          )
        }}
      </Boundary>
    </>
  )
}