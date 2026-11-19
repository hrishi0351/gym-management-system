import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import { createPlan, updatePlan } from '../../services/adminService.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'

const DEFAULT_DAYS = { monthly: 30, quarterly: 90, half_yearly: 180, yearly: 365 }
const parseFeatures = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean)

const toForm = (p) => ({
  name: p?.name ?? '',
  planType: p?.planType ?? 'monthly',
  durationDays: p?.durationDays ?? 30,
  price: p?.price ?? '',
  description: p?.description ?? '',
  featuresText: (p?.features ?? []).join('\n'),
  isPopular: p?.isPopular ?? false,
  isActive: p?.isActive ?? true,
})

function PlanForm({ plan, onSaved, onCancel }) {
  const isEdit = !!plan
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: toForm(plan) })

  const onSubmit = async (v) => {
    setFormError('')
    const payload = {
      name: v.name.trim(),
      planType: v.planType,
      durationDays: Number(v.durationDays),
      price: Number(v.price),
      description: v.description.trim(),
      features: parseFeatures(v.featuresText),
      isPopular: v.isPopular,
      isActive: v.isActive,
    }
    try {
      const saved = isEdit ? await updatePlan(plan.id, payload) : await createPlan(payload)
      toast.success(isEdit ? 'Plan updated' : 'Plan created')
      onSaved(saved)
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert>{formError}</FormAlert>

      <Input
        label="Plan name"
        error={errors.name?.message}
        {...register('name', {
          required: 'Name is required',
          minLength: { value: 2, message: 'Name must be at least 2 characters' },
          maxLength: { value: 100, message: 'Name must be at most 100 characters' },
        })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Plan type"
          error={errors.planType?.message}
          {...register('planType', {
            onChange: (event) => {
              const days = DEFAULT_DAYS[event.target.value]
              if (days) setValue('durationDays', days)
            },
          })}
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="half_yearly">Half-yearly</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom</option>
        </Select>
        <Input
          label="Duration (days)"
          type="number"
          error={errors.durationDays?.message}
          {...register('durationDays', {
            required: 'Duration is required',
            min: { value: 1, message: 'Must be at least 1 day' },
            max: { value: 3650, message: 'Must be at most 3650 days' },
          })}
        />
      </div>

      <Input
        label="Price (₹)"
        type="number"
        step="0.01"
        error={errors.price?.message}
        {...register('price', {
          required: 'Price is required',
          min: { value: 0, message: 'Price cannot be negative' },
        })}
      />

      <Input
        label="Short description"
        error={errors.description?.message}
        {...register('description', { maxLength: { value: 500, message: 'Keep it under 500 characters' } })}
      />

      <Textarea
        label="Features"
        rows={5}
        hint="One feature per line (up to 12)."
        error={errors.featuresText?.message}
        {...register('featuresText', {
          validate: (value) => {
            const items = parseFeatures(value)
            if (items.length > 12) return 'Add at most 12 features'
            if (items.some((item) => item.length > 100)) return 'Each feature must be 100 characters or fewer'
            return true
          },
        })}
      />

      <div className="space-y-3">
        <Checkbox label="Mark as most popular" hint="Shows a badge on the website." {...register('isPopular')} />
        <Checkbox label="Active" hint="Inactive plans are hidden from the website and cannot be sold." {...register('isActive')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Save changes' : 'Create plan'}
        </Button>
      </div>
    </form>
  )
}

export default function PlanFormModal({ open, plan, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={plan ? 'Edit plan' : 'Add plan'}>
      <PlanForm plan={plan} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  )
}