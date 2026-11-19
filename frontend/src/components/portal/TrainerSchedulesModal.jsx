import { useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import { addTrainerSchedule, removeTrainerSchedule } from '../../services/portalService.js'
import { getErrorMessage } from '../../utils/errors.js'
import { DAY_NAMES, formatTime } from '../../utils/format.js'

function Schedules({ initial, onChanged }) {
  const [cls, setCls] = useState(initial)
  const [day, setDay] = useState('1')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  const add = async (event) => {
    event.preventDefault()
    setFormError('')
    if (!start || !end) return setFormError('Please choose a start and an end time')
    if (end <= start) return setFormError('End time must be after the start time')
    setBusy(true)
    try {
      setCls(await addTrainerSchedule(cls.id, { dayOfWeek: Number(day), startTime: start, endTime: end }))
      toast.success('Time slot added')
      setStart('')
      setEnd('')
      onChanged()
    } catch (err) {
      setFormError(getErrorMessage(err)) // e.g. overlaps another of your classes
    } finally {
      setBusy(false)
    }
  }

  const remove = async (slot) => {
    setRemovingId(slot.id)
    try {
      setCls(await removeTrainerSchedule(slot.id))
      toast.success('Time slot removed')
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
        <span className="font-semibold text-fg">{cls.name}</span>. A time slot with upcoming bookings cannot be removed.
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

export default function TrainerSchedulesModal({ cls, onClose, onChanged }) {
  return (
    <Modal open={!!cls} onClose={onClose} title="Weekly schedule">
      {cls && <Schedules key={cls.id} initial={cls} onChanged={onChanged} />}
    </Modal>
  )
}