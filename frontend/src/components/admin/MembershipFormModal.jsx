import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { ErrorState } from '../StateViews.jsx'
import { MemberPicker } from './pickers.jsx'
import useFetch from '../../hooks/useFetch.js'
import { createMembership, listPlans } from '../../services/adminService.js'
import { PAYMENT_METHODS } from '../../utils/adminOptions.js'
import { fullName } from '../../utils/adminFormat.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'
import { formatCurrency, formatDuration } from '../../utils/format.js'

function NewMembershipForm({ member, onSaved, onCancel, onChangeMember }) {
  const plansState = useFetch(listPlans)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      planId: '',
      startDate: '',
      amountTotal: '',
      payNow: false,
      payAmount: '',
      method: 'cash',
      transactionRef: '',
      notes: '',
    },
  })
  const planId = useWatch({ control, name: 'planId' })
  const amountTotal = useWatch({ control, name: 'amountTotal' })
  const payNow = useWatch({ control, name: 'payNow' })

  if (plansState.loading) {
    return (
      <div className="flex justify-center py-10 text-brand">
        <Spinner size={28} label="Loading plans" />
      </div>
    )
  }
  if (plansState.error) return <ErrorState error={plansState.error} onRetry={plansState.retry} />

  const plans = plansState.data.filter((p) => p.isActive)
  const plan = plans.find((p) => String(p.id) === String(planId))
  const override = amountTotal === '' || amountTotal == null ? null : Number(amountTotal)
  let total = null
  if (override != null && Number.isFinite(override)) total = override
  else if (plan) total = plan.price

  const onSubmit = async (v) => {
    setFormError('')
    const payload = { memberId: member.id, planId: Number(v.planId) }
    if (v.startDate) payload.startDate = v.startDate
    if (v.amountTotal !== '') payload.amountTotal = Number(v.amountTotal)
    if (v.payNow) {
      payload.initialPayment = { amount: Number(v.payAmount), method: v.method }
      if (v.transactionRef.trim()) payload.initialPayment.transactionRef = v.transactionRef.trim()
      if (v.notes.trim()) payload.initialPayment.notes = v.notes.trim()
    }
    try {
      const saved = await createMembership(payload)
      toast.success(`Membership created (${saved.code})`)
      onSaved(saved)
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert>{formError}</FormAlert>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 p-4 text-sm">
        <div>
          <p className="text-xs text-muted">Member</p>
          <p className="font-semibold">
            {fullName(member)} <span className="font-normal text-muted">· {member.memberCode}</span>
          </p>
        </div>
        {onChangeMember && (
          <button type="button" onClick={onChangeMember} className="cursor-pointer font-semibold text-brand hover:underline">
            Change
          </button>
        )}
      </div>

      <Select label="Plan" error={errors.planId?.message} {...register('planId', { required: 'Please choose a plan' })}>
        <option value="">Select a plan</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} – {formatCurrency(p.price)} / {formatDuration(p.durationDays)}
          </option>
        ))}
      </Select>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start date (optional)"
          type="date"
          hint="Leave empty to start today. A renewal starts the day after the current one ends."
          error={errors.startDate?.message}
          {...register('startDate')}
        />
        <Input
          label="Custom total (₹, optional)"
          type="number"
          step="0.01"
          hint="Leave empty to use the plan price (discounts go here)."
          error={errors.amountTotal?.message}
          {...register('amountTotal', {
            validate: (v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0) || 'Enter 0 or more',
          })}
        />
      </div>

      {total != null && (
        <p className="text-sm">
          Total to pay: <span className="font-semibold text-brand">{formatCurrency(total)}</span>
        </p>
      )}

      <fieldset className="space-y-4 rounded-xl border border-line p-4">
        <legend className="px-2 text-sm font-semibold">First payment</legend>
        <Checkbox
          label="Record a payment now"
          hint="Any amount activates the membership once the start date arrives."
          {...register('payNow', {
            onChange: (event) => {
              if (event.target.checked && !getValues('payAmount') && total != null) {
                setValue('payAmount', String(total))
              }
            },
          })}
        />
        {payNow && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Amount (₹)"
                type="number"
                step="0.01"
                inputMode="decimal"
                error={errors.payAmount?.message}
                {...register('payAmount', {
                  validate: (value) => {
                    if (!getValues('payNow')) return true
                    const n = Number(value)
                    if (!Number.isFinite(n) || n <= 0) return 'Enter an amount greater than 0'
                    if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) return 'Use at most 2 decimal places'
                    if (total != null && Math.round(n * 100) > Math.round(total * 100)) {
                      return `Cannot exceed the total (${formatCurrency(total)})`
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
            <Input label="Transaction reference (optional)" {...register('transactionRef', { maxLength: { value: 100, message: 'Too long' } })} />
            <Input label="Notes (optional)" {...register('notes', { maxLength: { value: 255, message: 'Too long' } })} />
          </>
        )}
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create membership
        </Button>
      </div>
    </form>
  )
}

function Flow({ initialMember, onSaved, onClose }) {
  const [member, setMember] = useState(initialMember)

  if (!member) {
    return (
      <div>
        <p className="mb-3 text-sm text-muted">Choose the member who is joining or renewing.</p>
        <MemberPicker onSelect={setMember} />
      </div>
    )
  }
  return (
    <NewMembershipForm
      key={member.id}
      member={member}
      onSaved={onSaved}
      onCancel={onClose}
      onChangeMember={initialMember ? undefined : () => setMember(null)}
    />
  )
}

export default function MembershipFormModal({ open, member, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title="New membership" size="lg">
      <Flow initialMember={member} onSaved={onSaved} onClose={onClose} />
    </Modal>
  )
}