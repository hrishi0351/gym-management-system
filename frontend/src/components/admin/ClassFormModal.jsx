import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { ErrorState } from '../StateViews.jsx'
import useFetch from '../../hooks/useFetch.js'
import { createClass, listAllTrainers, updateClass } from '../../services/adminService.js'
import { DIFFICULTY_OPTIONS } from '../../utils/adminOptions.js'
import { fullName } from '../../utils/adminFormat.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'
import { DAY_NAMES } from '../../utils/format.js'

const toForm = (c) => ({
  name: c?.name ?? '',
  category: c?.category ?? '',
  description: c?.description ?? '',
  trainerId: c?.trainerId ? String(c.trainerId) : '',
  capacity: c?.capacity ?? 20,
  durationMinutes: c?.durationMinutes ?? 60,
  difficulty: c?.difficulty ?? 'all_levels',
  location: c?.location ?? '',
  imageUrl: c?.imageUrl ?? '',
  isActive: c?.isActive ?? true,
  schedules: [],
})

function ClassForm({ cls, onSaved, onCancel }) {
  const isEdit = !!cls
  const trainers = useFetch(listAllTrainers)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: toForm(cls) })
  const { fields, append, remove } = useFieldArray({ control, name: 'schedules' })

  if (trainers.loading) {
    return (
      <div className="flex justify-center py-10 text-brand">
        <Spinner size={28} label="Loading" />
      </div>
    )
  }
  if (trainers.error) return <ErrorState error={trainers.error} onRetry={trainers.retry} />

  const trainerOptions = trainers.data.filter((t) => t.status === 'active' || t.id === cls?.trainerId)

  const onSubmit = async (v) => {
    setFormError('')
    const payload = {
      name: v.name.trim(),
      category: v.category.trim(),
      description: v.description.trim(),
      trainerId: v.trainerId ? Number(v.trainerId) : null,
      capacity: Number(v.capacity),
      durationMinutes: Number(v.durationMinutes),
      difficulty: v.difficulty,
      location: v.location.trim(),
      imageUrl: v.imageUrl.trim(),
      isActive: v.isActive,
    }
    if (!isEdit) {
      payload.schedules = v.schedules.map((s) => ({
        dayOfWeek: Number(s.dayOfWeek),
        startTime: s.startTime,
        endTime: s.endTime,
      }))
    }
    try {
      const saved = isEdit ? await updateClass(cls.id, payload) : await createClass(payload)
      toast.success(isEdit ? 'Class updated' : 'Class created')
      onSaved(saved)
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert>{formError}</FormAlert>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Class name"
          error={errors.name?.message}
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
            maxLength: { value: 120, message: 'Name must be at most 120 characters' },
          })}
        />
        <Input
          label="Category"
          hint="For example: Yoga, HIIT, Strength"
          error={errors.category?.message}
          {...register('category', { maxLength: { value: 60, message: 'Keep it under 60 characters' } })}
        />
      </div>

      <Textarea
        label="Description"
        rows={3}
        error={errors.description?.message}
        {...register('description', { maxLength: { value: 2000, message: 'Keep it under 2000 characters' } })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Trainer" hint="Optional. You can assign one later." {...register('trainerId')}>
          <option value="">No trainer yet</option>
          {trainerOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {fullName(t)}
              {t.specialization ? ` – ${t.specialization}` : ''}
            </option>
          ))}
        </Select>
        <Select label="Difficulty" {...register('difficulty')}>
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Capacity"
          type="number"
          error={errors.capacity?.message}
          {...register('capacity', {
            required: 'Capacity is required',
            min: { value: 1, message: 'At least 1' },
            max: { value: 500, message: 'At most 500' },
          })}
        />
        <Input
          label="Duration (min)"
          type="number"
          error={errors.durationMinutes?.message}
          {...register('durationMinutes', {
            required: 'Duration is required',
            min: { value: 5, message: 'At least 5' },
            max: { value: 480, message: 'At most 480' },
          })}
        />
        <Input
          label="Location"
          error={errors.location?.message}
          {...register('location', { maxLength: { value: 100, message: 'Too long' } })}
        />
      </div>

      <Input
        label="Image (optional)"
        hint="A path like /classes/yoga.jpg (file in frontend/public) or an https link."
        error={errors.imageUrl?.message}
        {...register('imageUrl', {
          maxLength: { value: 255, message: 'Too long' },
          validate: (v) => !v.trim() || v.trim().startsWith('/') || /^https?:\/\//i.test(v.trim()) || 'Use a path starting with / or an http(s) link',
        })}
      />

      <Checkbox label="Active" hint="Inactive classes are hidden from the website and cannot be booked." {...register('isActive')} />

      {isEdit ? (
        <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">
          To change the weekly timetable, close this form and use the <strong>Schedule</strong> button on the class.
        </p>
      ) : (
        <fieldset className="space-y-3 rounded-xl border border-line p-4">
          <legend className="px-2 text-sm font-semibold">Weekly schedule (optional)</legend>
          {fields.length === 0 && <p className="text-sm text-muted">No time slots yet. Add one or add them later.</p>}
          {fields.map((field, i) => (
            <div key={field.id} className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Select aria-label={`Slot ${i + 1} day`} {...register(`schedules.${i}.dayOfWeek`)}>
                {DAY_NAMES.slice(1).map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </Select>
              <Input
                aria-label={`Slot ${i + 1} start time`}
                type="time"
                error={errors.schedules?.[i]?.startTime?.message}
                {...register(`schedules.${i}.startTime`, { required: 'Start time is required' })}
              />
              <Input
                aria-label={`Slot ${i + 1} end time`}
                type="time"
                error={errors.schedules?.[i]?.endTime?.message}
                {...register(`schedules.${i}.endTime`, {
                  required: 'End time is required',
                  validate: (end) => {
                    const start = getValues(`schedules.${i}.startTime`)
                    return !start || end > start || 'End must be after start'
                  },
                })}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove slot ${i + 1}`}
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-danger"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          ))}
          {fields.length < 21 && (
            <Button variant="secondary" size="sm" onClick={() => append({ dayOfWeek: '1', startTime: '', endTime: '' })}>
              <Plus size={15} aria-hidden="true" /> Add time slot
            </Button>
          )}
        </fieldset>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Save changes' : 'Create class'}
        </Button>
      </div>
    </form>
  )
}

export default function ClassFormModal({ open, cls, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={cls ? 'Edit class' : 'Add class'} size="lg">
      <ClassForm cls={cls} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  )
}