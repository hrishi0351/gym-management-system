import Modal from '../ui/Modal.jsx'
import Spinner from '../ui/Spinner.jsx'
import { ErrorState } from '../StateViews.jsx'
import StatusBadge from '../admin/StatusBadge.jsx'
import useResource from '../../hooks/useResource.js'
import { fetchTrainerMember } from '../../services/portalService.js'
import { formatDate, fullName } from '../../utils/adminFormat.js'

function Item({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{children || '–'}</dd>
    </div>
  )
}

function Detail({ id }) {
  const { data: m, error, loading, reload } = useResource(fetchTrainerMember, id)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!m || loading) {
    return (
      <div className="flex justify-center py-12 text-brand">
        <Spinner size={28} label="Loading member" />
      </div>
    )
  }

  const phone = m.phone ? m.phone.replace(/[^\d+]/g, '') : ''
  const emergencyPhone = m.emergencyContactPhone ? m.emergencyContactPhone.replace(/[^\d+]/g, '') : ''

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-bold uppercase">{fullName(m)}</p>
          <p className="text-sm text-muted">{m.memberCode}</p>
        </div>
        {m.membership ? <StatusBadge status={m.membership.status} /> : <span className="text-sm text-muted">No membership</span>}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Item label="Phone">
          {phone && (
            <a href={`tel:${phone}`} className="font-semibold text-brand hover:underline">
              {m.phone}
            </a>
          )}
        </Item>
        <Item label="Joined">{formatDate(m.joinedOn)}</Item>
        <Item label="Gender">
          <span className="capitalize">{m.gender}</span>
        </Item>
        <Item label="Date of birth">{m.dateOfBirth && formatDate(m.dateOfBirth)}</Item>
        <Item label="Height">{m.heightCm ? `${m.heightCm} cm` : ''}</Item>
        <Item label="Weight">{m.weightKg ? `${m.weightKg} kg` : ''}</Item>
        {m.membership && (
          <Item label="Plan">
            {m.membership.planName} · {formatDate(m.membership.startDate)} → {formatDate(m.membership.expiryDate)}
          </Item>
        )}
      </dl>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Health notes</p>
        <p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-surface-2 p-4 text-sm">
          {m.healthNotes || 'No health notes were added.'}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Item label="Emergency contact">{m.emergencyContactName}</Item>
        <Item label="Emergency phone">
          {emergencyPhone && (
            <a href={`tel:${emergencyPhone}`} className="font-semibold text-brand hover:underline">
              {m.emergencyContactPhone}
            </a>
          )}
        </Item>
      </dl>

      <p className="text-xs text-muted">
        You only see the details needed for coaching. Contact details, address and payments are visible to the front desk only.
      </p>
    </div>
  )
}

export default function TrainerMemberModal({ memberId, onClose }) {
  return (
    <Modal open={!!memberId} onClose={onClose} title="Member" size="lg">
      {memberId && <Detail id={memberId} />}
    </Modal>
  )
}