import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Clock, MapPin, User, Users, X } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import FormAlert from '../../components/ui/FormAlert.jsx'
import Select from '../../components/ui/Select.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import Tabs from '../../components/ui/Tabs.jsx'
import Button from '../../components/ui/Button.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useFetch from '../../hooks/useFetch.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import useResource from '../../hooks/useResource.js'
import {
  bookClass, cancelBooking, fetchAvailability, fetchMyBookings, fetchMyMemberships,
} from '../../services/portalService.js'
import { formatDate, statusLabel } from '../../utils/adminFormat.js'
import { shiftDate, todayLocal } from '../../utils/dateTime.js'
import { getErrorMessage } from '../../utils/errors.js'
import { DIFFICULTY, formatTime } from '../../utils/format.js'

const BOOKING_STYLE = {
  booked: 'bg-brand-soft text-brand',
  attended: 'bg-success-soft text-success',
  no_show: 'bg-danger-soft text-danger',
  cancelled: 'bg-surface-2 text-muted',
}

const parseDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const clockNow = () => new Date().toTimeString().slice(0, 5)
const longDate = (iso) => parseDate(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

const loadMemberships = () => fetchMyMemberships()

// ============================================================ Book a class
function DateStrip({ days, today, value, onChange }) {
  return (
    <div role="group" aria-label="Choose a date" className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {days.map((day) => {
        const selected = day === value
        const date = parseDate(day)
        return (
          <button
            key={day}
            type="button"
            onClick={() => onChange(day)}
            aria-pressed={selected}
            aria-label={longDate(day)}
            className={`flex w-16 shrink-0 cursor-pointer flex-col items-center rounded-xl border px-2 py-2.5 transition-colors ${
              selected ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface hover:border-brand'
            }`}
          >
            <span className="text-xs font-medium">
              {day === today ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' })}
            </span>
            <span className="font-display text-2xl font-bold leading-tight">{date.getDate()}</span>
            <span className="text-xs">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
          </button>
        )
      })}
    </div>
  )
}

function BookTab() {
  const [today] = useState(todayLocal)
  const [date, setDate] = useState(today)
  const [nowTime, setNowTime] = useState(clockNow)
  const availability = useResource(fetchAvailability, date)
  const memberships = useFetch(loadMemberships)
  const [busyId, setBusyId] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [cancelBusy, setCancelBusy] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNowTime(clockNow()), 60000)
    return () => clearInterval(timer)
  }, [])

  const days = useMemo(() => Array.from({ length: 15 }, (_, i) => shiftDate(today, i)), [today])
  const noActive = memberships.data ? memberships.data.current?.status !== 'active' : false

  const book = async (slot) => {
    setBusyId(slot.scheduleId)
    try {
      await bookClass({ scheduleId: slot.scheduleId, date })
      toast.success(`Booked: ${slot.name}`)
      availability.reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  const confirmCancel = async () => {
    setCancelBusy(true)
    try {
      await cancelBooking(cancelling.myBookingId)
      toast.success('Booking cancelled')
      availability.reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setCancelBusy(false)
      setCancelling(null)
    }
  }

  function action(slot) {
    const started = date === today && slot.startTime <= nowTime
    if (slot.myBookingId) {
      if (started) return <span className="text-sm font-semibold text-success">Booked</span>
      return (
        <Button variant="secondary" size="sm" onClick={() => setCancelling(slot)}>
          <X size={15} aria-hidden="true" /> Cancel booking
        </Button>
      )
    }
    if (started) return <span className="text-sm text-muted">Started</span>
    if (slot.isFull) return <span className="text-sm font-semibold text-danger">Full</span>
    return (
      <Button size="sm" onClick={() => book(slot)} loading={busyId === slot.scheduleId} disabled={noActive}>
        Book
      </Button>
    )
  }

  let body
  if (availability.error) {
    body = <ErrorState error={availability.error} onRetry={availability.reload} />
  } else if (!availability.data) {
    body = (
      <div className="flex justify-center py-16 text-brand">
        <Spinner size={30} label="Loading classes" />
      </div>
    )
  } else if (availability.data.length === 0) {
    body = (
      <p className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
        No classes run on {longDate(date)}. Try another day.
      </p>
    )
  } else {
    body = (
      <ul className="grid gap-4 md:grid-cols-2">
        {availability.data.map((slot) => {
          const difficulty = DIFFICULTY[slot.difficulty] || DIFFICULTY.all_levels
          return (
            <li key={slot.scheduleId} className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                {slot.category && (
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">{slot.category}</span>
                )}
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficulty.className}`}>{difficulty.label}</span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-bold uppercase">{slot.name}</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <Clock size={15} aria-hidden="true" />
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </li>
                {slot.location && (
                  <li className="flex items-center gap-2">
                    <MapPin size={15} aria-hidden="true" /> {slot.location}
                  </li>
                )}
                {slot.trainerName && (
                  <li className="flex items-center gap-2">
                    <User size={15} aria-hidden="true" /> {slot.trainerName}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Users size={15} aria-hidden="true" />
                  {slot.isFull ? 'No seats left' : `${slot.spotsLeft} of ${slot.capacity} seats left`}
                </li>
              </ul>
              <div className="mt-4 flex items-center justify-end pt-1">{action(slot)}</div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <>
      {noActive && (
        <div className="mb-5">
          <FormAlert variant="info">
            You need an active membership to book classes. Visit the front desk to join or renew.
          </FormAlert>
        </div>
      )}

      <DateStrip days={days} today={today} value={date} onChange={setDate} />
      <h2 className="mb-4 font-display text-2xl font-bold uppercase">{longDate(date)}</h2>
      {body}

      <ConfirmDialog
        open={!!cancelling}
        danger
        title="Cancel this booking?"
        message={cancelling ? `${cancelling.name} on ${longDate(date)} at ${formatTime(cancelling.startTime)}. Your seat will be given to someone else.` : ''}
        confirmLabel="Cancel booking"
        loading={cancelBusy}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
      />
    </>
  )
}

// ============================================================ My bookings
const FILTERS = {
  upcoming: { upcoming: 'true' },
  all: {},
  attended: { status: 'attended' },
  cancelled: { status: 'cancelled' },
}

function BookingsTab() {
  const [today] = useState(todayLocal)
  const [filter, setFilter] = useState('upcoming')
  const [page, setPage] = useState(1)
  const list = useList(fetchMyBookings, { ...FILTERS[filter], page, limit: 10 })
  const [cancelling, setCancelling] = useState(null)
  const [cancelBusy, setCancelBusy] = useState(false)

  const confirmCancel = async () => {
    setCancelBusy(true)
    try {
      await cancelBooking(cancelling.id)
      toast.success('Booking cancelled')
      list.reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setCancelBusy(false)
      setCancelling(null)
    }
  }

  const columns = [
    {
      key: 'class',
      header: 'Class',
      cell: (b) => (
        <div>
          <p className="font-semibold">{b.className}</p>
          <p className="text-xs text-muted">{[b.trainerName, b.location].filter(Boolean).join(' · ') || '–'}</p>
        </div>
      ),
    },
    {
      key: 'when',
      header: 'When',
      cell: (b) => (
        <div>
          <p>{formatDate(b.date)}</p>
          <p className="text-xs text-muted">
            {formatTime(b.startTime)} – {formatTime(b.endTime)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BOOKING_STYLE[b.status] || BOOKING_STYLE.cancelled}`}>
          {statusLabel(b.status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (b) =>
        b.status === 'booked' && b.date >= today ? (
          <div className="flex justify-end">
            <IconButton icon={X} label={`Cancel ${b.className} on ${formatDate(b.date)}`} onClick={() => setCancelling(b)} danger />
          </div>
        ) : null,
    },
  ]

  return (
    <>
      <div className="mb-4">
        <Select
          label="Show"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value)
            setPage(1)
          }}
          className="w-52"
        >
          <option value="upcoming">Upcoming bookings</option>
          <option value="all">All bookings</option>
          <option value="attended">Attended</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Your class bookings"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No bookings found"
            emptyText="Book a class from the Book a class tab."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!cancelling}
        danger
        title="Cancel this booking?"
        message={cancelling ? `${cancelling.className} on ${formatDate(cancelling.date)} at ${formatTime(cancelling.startTime)}.` : ''}
        confirmLabel="Cancel booking"
        loading={cancelBusy}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
      />
    </>
  )
}

// ============================================================ Page
const TABS = [
  { id: 'book', label: 'Book a class' },
  { id: 'mine', label: 'My bookings' },
]

export default function MemberClasses() {
  usePageTitle('Classes')
  const [tab, setTab] = useState('book')

  return (
    <>
      <PageHeading title="Classes" subtitle="Book a spot up to 14 days ahead. Cancel any time before the class starts." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Classes" idPrefix="classes" />
      <div role="tabpanel" id="classes-panel" aria-labelledby={`classes-tab-${tab}`}>
        {tab === 'book' ? <BookTab /> : <BookingsTab />}
      </div>
    </>
  )
}