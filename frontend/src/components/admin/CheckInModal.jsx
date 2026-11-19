import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import { MemberPicker } from './pickers.jsx'
import { checkIn } from '../../services/adminService.js'
import { fullName } from '../../utils/adminFormat.js'
import { getErrorMessage } from '../../utils/errors.js'

function CheckInFlow({ onSaved, onClose }) {
  const [member, setMember] = useState(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!member) {
    return (
      <div>
        <p className="mb-3 text-sm text-muted">Only members with an active membership are listed.</p>
        <MemberPicker activeOnly onSelect={setMember} />
      </div>
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await checkIn({ memberId: member.id, notes: notes.trim() || undefined })
      toast.success(`${fullName(member)} checked in`)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormAlert>{error}</FormAlert>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 p-4 text-sm">
        <div>
          <p className="font-semibold">{fullName(member)}</p>
          <p className="text-xs text-muted">{member.memberCode}</p>
        </div>
        <button type="button" onClick={() => setMember(null)} className="cursor-pointer font-semibold text-brand hover:underline">
          Change
        </button>
      </div>
      <Input label="Notes (optional)" value={notes} maxLength={255} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Check in
        </Button>
      </div>
    </form>
  )
}

export default function CheckInModal({ open, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title="Check in a member">
      <CheckInFlow onSaved={onSaved} onClose={onClose} />
    </Modal>
  )
}