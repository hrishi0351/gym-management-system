import { useState } from 'react'
import { CalendarClock, Clock, MapPin, Pencil, Users } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import Boundary from '../../components/portal/Boundary.jsx'
import TrainerClassEditModal from '../../components/portal/TrainerClassEditModal.jsx'
import TrainerSchedulesModal from '../../components/portal/TrainerSchedulesModal.jsx'
import TrainerBookingsModal from '../../components/portal/TrainerBookingsModal.jsx'
import Button from '../../components/ui/Button.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import useResource from '../../hooks/useResource.js'
import { fetchTrainerClasses } from '../../services/portalService.js'
import { DAY_SHORT, DIFFICULTY, formatTime } from '../../utils/format.js'

function ClassCard({ cls, onEdit, onSchedule, onBookings }) {
  const difficulty = DIFFICULTY[cls.difficulty] || DIFFICULTY.all_levels

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {cls.category && <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">{cls.category}</span>}
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficulty.className}`}>{difficulty.label}</span>
        {!cls.isActive && <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">Inactive</span>}
      </div>

      <h2 className="mt-3 font-display text-2xl font-bold uppercase">{cls.name}</h2>
      {cls.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{cls.description}</p>}

      <ul className="mt-3 space-y-1.5 text-sm text-muted">
        <li className="flex items-center gap-2">
          <Clock size={15} aria-hidden="true" /> {cls.durationMinutes} minutes
        </li>
        <li className="flex items-center gap-2">
          <Users size={15} aria-hidden="true" /> Up to {cls.capacity} people
        </li>
        <li className="flex items-center gap-2">
          <MapPin size={15} aria-hidden="true" /> {cls.location || 'No location set'}
        </li>
      </ul>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Weekly schedule</p>
        {cls.schedules.length === 0 ? (
          <p className="text-sm text-muted">No time slots yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {cls.schedules.map((slot) => (
              <span key={slot.id} className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs">
                {DAY_SHORT[slot.dayOfWeek]} {formatTime(slot.startTime)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button size="sm" variant="secondary" onClick={() => onSchedule(cls)}>
          <CalendarClock size={15} aria-hidden="true" /> Schedule
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onBookings(cls)}>
          <Users size={15} aria-hidden="true" /> Bookings
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(cls)}>
          <Pencil size={15} aria-hidden="true" /> Edit
        </Button>
      </div>
    </article>
  )
}

export default function TrainerClasses() {
  usePageTitle('My Classes')
  const state = useResource(fetchTrainerClasses, 'mine') // keeps the list on screen while it refreshes
  const [editing, setEditing] = useState(null)
  const [scheduling, setScheduling] = useState(null)
  const [bookingsFor, setBookingsFor] = useState(null)

  return (
    <>
      <PageHeading title="My classes" subtitle="Classes assigned to you. Manage their timetable and see who has booked." />

      <Boundary state={state}>
        {(classes) =>
          classes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
              No classes are assigned to you yet. The admin can assign you a class from the Classes page.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {classes.map((cls) => (
                <ClassCard key={cls.id} cls={cls} onEdit={setEditing} onSchedule={setScheduling} onBookings={setBookingsFor} />
              ))}
            </div>
          )
        }
      </Boundary>

      <TrainerClassEditModal
        cls={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          state.reload()
        }}
      />
      <TrainerSchedulesModal cls={scheduling} onClose={() => setScheduling(null)} onChanged={state.reload} />
      <TrainerBookingsModal cls={bookingsFor} onClose={() => setBookingsFor(null)} />
    </>
  )
}