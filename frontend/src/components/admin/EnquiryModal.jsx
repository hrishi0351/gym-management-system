import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { ErrorState } from '../StateViews.jsx'
import { buttonClasses } from '../ui/buttonStyles.js'
import StatusBadge from './StatusBadge.jsx'
import useResource from '../../hooks/useResource.js'
import { fetchEnquiry, updateEnquiry } from '../../services/adminService.js'
import { formatDateTime } from '../../utils/adminFormat.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'

function Item({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{children || '–'}</dd>
    </div>
  )
}

function EnquiryForm({ enquiry, onSaved, onCancel }) {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { status: enquiry.status, adminNotes: enquiry.adminNotes ?? '' } })

  const onSubmit = async (v) => {
    setFormError('')
    try {
      await updateEnquiry(enquiry.id, { status: v.status, adminNotes: v.adminNotes.trim() })
      toast.success('Enquiry updated')
      onSaved()
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-xl border border-line p-4">
      <FormAlert>{formError}</FormAlert>
      <Select label="Status" {...register('status')}>
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="converted">Converted (joined)</option>
        <option value="closed">Closed</option>
      </Select>
      <Textarea
        label="Internal notes"
        rows={3}
        hint="Only admins can see these notes."
        error={errors.adminNotes?.message}
        {...register('adminNotes', { maxLength: { value: 500, message: 'Please keep this under 500 characters' } })}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  )
}

function Detail({ id, onSaved, onClose }) {
  const { data: e, error, loading, reload } = useResource(fetchEnquiry, id)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!e || loading) {
    return (
      <div className="flex justify-center py-12 text-brand">
        <Spinner size={28} label="Loading enquiry" />
      </div>
    )
  }

  const phoneDigits = e.phone ? e.phone.replace(/[^\d+]/g, '') : ''

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-bold uppercase">{e.name}</p>
          <p className="text-sm text-muted">Received {formatDateTime(e.createdAt)}</p>
        </div>
        <StatusBadge status={e.status} />
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Item label="Email">
          <a href={`mailto:${encodeURIComponent(e.email)}`} className="font-semibold text-brand hover:underline">
            {e.email}
          </a>
        </Item>
        <Item label="Phone">
          {e.phone && (
            <a href={`tel:${phoneDigits}`} className="font-semibold text-brand hover:underline">
              {e.phone}
            </a>
          )}
        </Item>
        <Item label="Interested plan">{e.planName}</Item>
        <Item label="Last handled by">{e.handledBy}</Item>
      </dl>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Message</p>
        <p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-surface-2 p-4 text-sm">
          {e.message || 'No message was left.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={`mailto:${encodeURIComponent(e.email)}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
          Send email
        </a>
        {phoneDigits && (
          <a href={`tel:${phoneDigits}`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            Call
          </a>
        )}
      </div>

      <EnquiryForm key={e.id} enquiry={e} onSaved={onSaved} onCancel={onClose} />
    </div>
  )
}

export default function EnquiryModal({ enquiryId, onClose, onSaved }) {
  return (
    <Modal open={!!enquiryId} onClose={onClose} title="Enquiry" size="lg">
      <Detail id={enquiryId} onSaved={onSaved} onClose={onClose} />
    </Modal>
  )
}