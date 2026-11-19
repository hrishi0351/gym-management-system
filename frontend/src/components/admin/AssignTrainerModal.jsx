import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Select from '../ui/Select.jsx'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { ErrorState } from '../StateViews.jsx'
import useFetch from '../../hooks/useFetch.js'
import { assignTrainer, listAllTrainers } from '../../services/adminService.js'
import { getErrorMessage } from '../../utils/errors.js'
import { fullName } from '../../utils/adminFormat.js'

function AssignForm({ memberId, currentTrainerId, onDone, onCancel }) {
  const trainers = useFetch(listAllTrainers)
  const [trainerId, setTrainerId] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (trainers.loading) {
    return (
      <div className="flex justify-center py-10 text-brand">
        <Spinner size={28} label="Loading trainers" />
      </div>
    )
  }
  if (trainers.error) return <ErrorState error={trainers.error} onRetry={trainers.retry} />

  const options = trainers.data.filter((t) => t.status === 'active' && t.id !== currentTrainerId)

  const submit = async (event) => {
    event.preventDefault()
    if (!trainerId) {
      setError('Please choose a trainer')
      return
    }
    setError('')
    setBusy(true)
    try {
      await assignTrainer(memberId, { trainerId: Number(trainerId), notes: notes.trim() || undefined })
      toast.success('Trainer assigned')
      onDone()
    } catch (err) {
      setError(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormAlert>{error}</FormAlert>
      {options.length === 0 ? (
        <p className="text-sm text-muted">There are no other active trainers available. Add a trainer first.</p>
      ) : (
        <Select label="Trainer" value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
          <option value="">Select a trainer</option>
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {fullName(t)}
              {t.specialization ? ` – ${t.specialization}` : ''}
            </option>
          ))}
        </Select>
      )}
      <Input
        label="Notes (optional)"
        value={notes}
        maxLength={255}
        onChange={(e) => setNotes(e.target.value)}
        hint="For example: goals or special instructions."
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy} disabled={options.length === 0}>
          Assign trainer
        </Button>
      </div>
    </form>
  )
}

export default function AssignTrainerModal({ open, memberId, currentTrainerId, onClose, onDone }) {
  return (
    <Modal open={open} onClose={onClose} title={currentTrainerId ? 'Change trainer' : 'Assign trainer'}>
      <AssignForm memberId={memberId} currentTrainerId={currentTrainerId} onDone={onDone} onCancel={onClose} />
    </Modal>
  )
}