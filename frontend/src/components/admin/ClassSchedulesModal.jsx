import { useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { ErrorState } from '../StateViews.jsx'
import useResource from '../../hooks/useResource.js'
import { addSchedule, fetchClass, removeSchedule } from '../../services/adminService.js'
import { getErrorMessage } from '../../utils/errors.js'
import { DAY_NAMES, formatTime } from '../../utils/format.js'

function Schedules({ classId, onChanged }) {
  const { data: cls, error, loading, reload } = useResource(fetchClass, classId)
  const [day, setDay] = useState('1')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!cls || loading) {
    return (
      <div className="flex justify-center py-10 text-brand">
        <Spinner size={28} label="Loading schedule" />
      </div>
    )
  }

  const add = async (event) => {
    event.preventDefault()
    setFormError('')
    if (!start || !end) return setFormError('Please choose a start and an end time')
    if (end <= start) return setFormError('End time must be after the start time')
    setBusy(true)
    try {
      await addSchedule(cls.id, { dayOfWeek: Number(day), startTime: start, endTime: end })
      toast.success('Time slot added')
      setStart('')
      setEnd('')
      reload()
      onChanged()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (slot) => {
    setRemovingId(slot.id)
    try {
      await removeSchedule(slot.id)
      toast.success('Time slot removed')
      reload()
      onChanged()
    } catch (err) {
      toast.error(getErrorMessage(err)) // e.g. upcoming bookings exist
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        <span className="font-semibold text-fg">{cls.name}</span>
        {cls.trainer ? ` · with ${cls.trainer.name}` : ' · no trainer assigned'}
      </p>

      {cls.schedules.length === 0 ? (
        <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">No time slots yet. Add the first one below.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {cls.schedules.map((slot) => (
            <li key={slot.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-semibold">{DAY_NAMES[slot.dayOfWeek]}</p>
                <p className="text-sm text-muted">
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(slot)}
                disabled={removingId === slot.id}
                aria-label={`Remove ${DAY_NAMES[slot.dayOfWeek]} ${formatTime(slot.startTime)} slot`}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger disabled:opacity-50"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} noValidate className="space-y-3 rounded-xl border border-line p-4">
        <p className="text-sm font-semibold">Add a weekly time slot</p>
        <FormAlert>{formError}</FormAlert>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Day" value={day} onChange={(e) => setDay(e.target.value)}>
            {DAY_NAMES.slice(1).map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </Select>
          <Input label="Start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input label="End" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={busy}>
            Add slot
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function ClassSchedulesModal({ classId, onClose, onChanged }) {
  return (
    <Modal open={!!classId} onClose={onClose} title="Weekly schedule">
      <Schedules classId={classId} onChanged={onChanged} />
    </Modal>
  )
}