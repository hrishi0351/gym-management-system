import { DAY_NAMES, formatTime } from '../utils/format.js'

export default function WeeklyTimetable({ classes }) {
  const days = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
    day,
    slots: classes
      .flatMap((c) =>
        c.schedules
          .filter((s) => s.dayOfWeek === day)
          .map((s) => ({ id: s.id, startTime: s.startTime, endTime: s.endTime, name: c.name, trainer: c.trainer?.name }))
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }))

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {days.map(({ day, slots }) => (
        <li key={day} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-6">
          <h3 className="w-32 shrink-0 font-display text-2xl font-bold uppercase">{DAY_NAMES[day]}</h3>
          {slots.length === 0 ? (
            <p className="text-sm text-muted">No classes</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <li key={slot.id} className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm">
                  <span className="font-semibold text-brand">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </span>
                  <span className="block font-medium">{slot.name}</span>
                  {slot.trainer && <span className="block text-xs text-muted">with {slot.trainer}</span>}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}