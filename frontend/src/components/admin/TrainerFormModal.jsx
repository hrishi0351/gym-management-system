import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import PasswordField from '../ui/PasswordField.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import PasswordRules from '../PasswordRules.jsx'
import { createTrainer, updateTrainer } from '../../services/adminService.js'
import { validatePassword } from '../../utils/passwordPolicy.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/

const nameRules = (label) => ({
  required: `${label} is required`,
  maxLength: { value: 60, message: `${label} must be at most 60 characters` },
  pattern: { value: NAME_RE, message: `${label} contains invalid characters` },
})

const toForm = (t) => ({
  firstName: t?.firstName ?? '',
  lastName: t?.lastName ?? '',
  email: t?.email ?? '',
  phone: t?.phone ?? '',
  password: '',
  status: t?.status ?? 'active',
  specialization: t?.specialization ?? '',
  certifications: t?.certifications ?? '',
  experienceYears: t?.experienceYears ?? 0,
  hiredOn: t?.hiredOn ?? '',
  isFeatured: t?.isFeatured ?? false,
  bio: t?.bio ?? '',
})

function TrainerForm({ trainer, onSaved, onCancel }) {
  const isEdit = !!trainer
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: toForm(trainer) })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = async (v) => {
    setFormError('')
    const payload = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      phone: v.phone.trim(),
      specialization: v.specialization.trim(),
      certifications: v.certifications.trim(),
      experienceYears: v.experienceYears === '' ? 0 : Number(v.experienceYears),
      hiredOn: v.hiredOn,
      isFeatured: v.isFeatured,
      bio: v.bio.trim(),
    }
    try {
      const saved = isEdit
        ? await updateTrainer(trainer.id, { ...payload, status: v.status })
        : await createTrainer({ ...payload, email: v.email.trim(), password: v.password })
      toast.success(isEdit ? 'Trainer updated' : 'Trainer created')
      onSaved(saved)
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert>{formError}</FormAlert>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" error={errors.firstName?.message} {...register('firstName', nameRules('First name'))} />
        <Input label="Last name" error={errors.lastName?.message} {...register('lastName', nameRules('Last name'))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {isEdit ? (
          <Input label="Email" value={trainer.email} disabled readOnly hint="Email cannot be changed here." onChange={() => {}} />
        ) : (
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: EMAIL_RE, message: 'Enter a valid email address' },
            })}
          />
        )}
        <Input
          label="Phone"
          type="tel"
          error={errors.phone?.message}
          {...register('phone', { pattern: { value: PHONE_RE, message: 'Enter a valid phone number' } })}
        />
      </div>

      {isEdit ? (
        <Select label="Account status" hint="Only active trainers appear on the public website." {...register('status')}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </Select>
      ) : (
        <div>
          <PasswordField
            label="Initial password"
            autoComplete="new-password"
            hint="Share it with the trainer. They can change it after logging in."
            error={errors.password?.message}
            {...register('password', { validate: validatePassword })}
          />
          <PasswordRules value={password} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Specialization" error={errors.specialization?.message} {...register('specialization', { maxLength: { value: 120, message: 'Too long' } })} />
        <Input label="Certifications" error={errors.certifications?.message} {...register('certifications', { maxLength: { value: 255, message: 'Too long' } })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Experience (years)"
          type="number"
          min="0"
          max="80"
          error={errors.experienceYears?.message}
          {...register('experienceYears', {
            min: { value: 0, message: 'Must be 0 or more' },
            max: { value: 80, message: 'Must be 80 or less' },
          })}
        />
        <Input label="Hired on" type="date" error={errors.hiredOn?.message} {...register('hiredOn')} />
      </div>

      <Textarea
        label="Bio"
        rows={4}
        hint="Shown on the public Trainers page."
        error={errors.bio?.message}
        {...register('bio', { maxLength: { value: 2000, message: 'Please keep this under 2000 characters' } })}
      />

      <Checkbox label="Featured trainer" hint="Featured trainers are listed first on the website." {...register('isFeatured')} />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Save changes' : 'Create trainer'}
        </Button>
      </div>
    </form>
  )
}

export default function TrainerFormModal({ open, trainer, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={trainer ? 'Edit trainer' : 'Add trainer'} size="lg">
      <TrainerForm trainer={trainer} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  )
}