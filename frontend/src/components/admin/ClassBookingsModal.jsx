import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Spinner from '../ui/Spinner.jsx'
import { ErrorState } from '../StateViews.jsx'
import useResource from '../../hooks/useResource.js'
import { fetchClassBookings } from '../../services/adminService.js'
import { statusLabel } from '../../utils/adminFormat.js'
import { todayLocal } from '../../utils/dateTime.js'
import { DAY_SHORT, formatTime } from '../../utils/format.js'

// key = "classId|date"
const loadBookings = (key) => {
  const [id, date] = key.split('|')
  return fetchClassBookings(id, date)
}

const BOOKING_STYLE = {
  booked: 'bg-brand-soft text-brand',
  attended: 'bg-success-soft text-success',
  no_show: 'bg-danger-soft text-danger',
}

function Bookings({ cls }) {
  const [date, setDate] = useState(todayLocal)
  const { data, error, loading, reload } = useResource(loadBookings, `${cls.id}|${date}`)

  // group by time slot
  const groups = []
  for (const booking of data?.bookings ?? []) {
    const key = `${booking.startTime}-${booking.endTime}`
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = { key, startTime: booking.startTime, endTime: booking.endTime, items: [] }
      groups.push(group)
    }
    group.items.push(booking)
  }

  const runsOn = [...new Set(cls.schedules.map((s) => s.dayOfWeek))].sort().map((d) => DAY_SHORT[d]).join(', ')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-semibold">{cls.name}</p>
          <p className="text-sm text-muted">{runsOn ? `Runs on: ${runsOn}` : 'No time slots yet'}</p>
        </div>
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data || loading ? (
        <div className="flex justify-center py-10 text-brand">
          <Spinner size={28} label="Loading bookings" />
        </div>
      ) : groups.length === 0 ? (
        <p className="rounded-xl bg-surface-2 p-6 text-center text-sm text-muted">
          No bookings on this date. Pick a day on which the class runs.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="overflow-hidden rounded-xl border border-line">
            <h3 className="flex items-center justify-between bg-surface-2 px-4 py-2.5 text-sm font-semibold">
              <span>
                {formatTime(group.startTime)} – {formatTime(group.endTime)}
              </span>
              <span className="text-muted">
                {group.items.length} / {cls.capacity} booked
              </span>
            </h3>
            <ul className="divide-y divide-line">
              {group.items.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <Link to={`/admin/members/${b.memberId}`} className="font-medium hover:text-brand">
                    {b.memberName} <span className="font-normal text-muted">· {b.memberCode}</span>
                  </Link>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BOOKING_STYLE[b.status] || 'bg-surface-2 text-muted'}`}>
                    {statusLabel(b.status)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

export default function ClassBookingsModal({ cls, onClose }) {
  return (
    <Modal open={!!cls} onClose={onClose} title="Class bookings" size="lg">
      {cls && <Bookings cls={cls} />}
    </Modal>
  )
}