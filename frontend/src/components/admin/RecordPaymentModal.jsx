import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import { MembershipPicker } from './pickers.jsx'
import { recordPayment } from '../../services/adminService.js'
import { PAYMENT_METHODS } from '../../utils/adminOptions.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'
import { formatCurrency } from '../../utils/format.js'

function PaymentForm({ membership, onSaved, onCancel, onChangeMembership }) {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { amount: String(membership.balance), method: 'cash', transactionRef: '', notes: '' },
  })

  const onSubmit = async (v) => {
    setFormError('')
    const payload = { membershipId: membership.id, amount: Number(v.amount), method: v.method }
    if (v.transactionRef.trim()) payload.transactionRef = v.transactionRef.trim()
    if (v.notes.trim()) payload.notes = v.notes.trim()
    try {
      const saved = await recordPayment(payload)
      toast.success(`Payment recorded (${saved.receiptNo})`)
      onSaved(saved)
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert>{formError}</FormAlert>

      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Member</dt>
          <dd className="font-semibold">{membership.memberName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Plan</dt>
          <dd>{membership.planName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Paid so far</dt>
          <dd>
            {formatCurrency(membership.amountPaid)} of {formatCurrency(membership.amountTotal)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Balance due</dt>
          <dd className="font-semibold text-danger">{formatCurrency(membership.balance)}</dd>
        </div>
      </dl>
      {onChangeMembership && (
        <button type="button" onClick={onChangeMembership} className="cursor-pointer text-sm font-semibold text-brand hover:underline">
          Choose a different membership
        </button>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Amount (₹)"
          type="number"
          step="0.01"
          inputMode="decimal"
          error={errors.amount?.message}
          {...register('amount', {
            validate: (value) => {
              const n = Number(value)
              if (!Number.isFinite(n) || n <= 0) return 'Enter an amount greater than 0'
              if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) return 'Use at most 2 decimal places'
              if (Math.round(n * 100) > Math.round(membership.balance * 100)) {
                return `Cannot exceed the balance (${formatCurrency(membership.balance)})`
              }
              return true
            },
          })}
        />
        <Select label="Method" {...register('method')}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Transaction reference (optional)"
        hint="UPI ID, card slip number, cheque number…"
        error={errors.transactionRef?.message}
        {...register('transactionRef', { maxLength: { value: 100, message: 'Keep it under 100 characters' } })}
      />
      <Input
        label="Notes (optional)"
        error={errors.notes?.message}
        {...register('notes', { maxLength: { value: 255, message: 'Keep it under 255 characters' } })}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Record payment
        </Button>
      </div>
    </form>
  )
}

function PaymentFlow({ initial, onSaved, onClose }) {
  const [membership, setMembership] = useState(initial)

  if (!membership) {
    return (
      <div>
        <p className="mb-3 text-sm text-muted">
          Choose the membership that is receiving this payment. Only memberships with a balance due are listed.
        </p>
        <MembershipPicker onSelect={setMembership} />
      </div>
    )
  }
  return (
    <PaymentForm
      key={membership.id}
      membership={membership}
      onSaved={onSaved}
      onCancel={onClose}
      onChangeMembership={initial ? undefined : () => setMembership(null)}
    />
  )
}

export default function RecordPaymentModal({ open, membership, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title="Record payment" size="lg">
      <PaymentFlow initial={membership} onSaved={onSaved} onClose={onClose} />
    </Modal>
  )
}