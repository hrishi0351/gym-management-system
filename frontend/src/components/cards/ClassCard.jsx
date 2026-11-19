import { Clock, MapPin, User, Users } from 'lucide-react'
import { DAY_SHORT, DIFFICULTY, formatTime } from '../../utils/format.js'

export default function ClassCard({ cls }) {
  const difficulty = DIFFICULTY[cls.difficulty] || DIFFICULTY.all_levels

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {cls.category && (
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">{cls.category}</span>
        )}
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficulty.className}`}>
          {difficulty.label}
        </span>
      </div>

      <h3 className="mt-3 font-display text-2xl font-bold uppercase">{cls.name}</h3>
      {cls.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{cls.description}</p>}

      <ul className="mt-4 space-y-1.5 text-sm text-muted">
        <li className="flex items-center gap-2">
          <Clock size={15} aria-hidden="true" /> {cls.durationMinutes} minutes
        </li>
        <li className="flex items-center gap-2">
          <Users size={15} aria-hidden="true" /> Up to {cls.capacity} people
        </li>
        {cls.location && (
          <li className="flex items-center gap-2">
            <MapPin size={15} aria-hidden="true" /> {cls.location}
          </li>
        )}
        {cls.trainer && (
          <li className="flex items-center gap-2">
            <User size={15} aria-hidden="true" /> {cls.trainer.name}
          </li>
        )}
      </ul>

      <div className="mt-auto pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Schedule</p>
        {cls.schedules.length === 0 ? (
          <p className="text-sm text-muted">Schedule coming soon</p>
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
    </article>
  )
}