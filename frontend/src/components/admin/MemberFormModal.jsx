import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Textarea from '../ui/Textarea.jsx'
import PasswordField from '../ui/PasswordField.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import PasswordRules from '../PasswordRules.jsx'
import { createMember, updateMember } from '../../services/adminService.js'
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

const toForm = (m) => ({
  firstName: m?.firstName ?? '',
  lastName: m?.lastName ?? '',
  email: m?.email ?? '',
  phone: m?.phone ?? '',
  password: '',
  status: m?.status ?? 'active',
  gender: m?.gender ?? '',
  dateOfBirth: m?.dateOfBirth ?? '',
  address: m?.address ?? '',
  city: m?.city ?? '',
  state: m?.state ?? '',
  postalCode: m?.postalCode ?? '',
  emergencyContactName: m?.emergencyContactName ?? '',
  emergencyContactPhone: m?.emergencyContactPhone ?? '',
  heightCm: m?.heightCm ?? '',
  weightKg: m?.weightKg ?? '',
  healthNotes: m?.healthNotes ?? '',
})

const toNumber = (value) => (value === '' || value == null ? '' : Number(value))

function MemberForm({ member, onSaved, onCancel }) {
  const isEdit = !!member
  const [today] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: toForm(member) })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = async (v) => {
    setFormError('')
    const payload = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      phone: v.phone.trim(),
      gender: v.gender,
      dateOfBirth: v.dateOfBirth,
      address: v.address.trim(),
      city: v.city.trim(),
      state: v.state.trim(),
      postalCode: v.postalCode.trim(),
      emergencyContactName: v.emergencyContactName.trim(),
      emergencyContactPhone: v.emergencyContactPhone.trim(),
      heightCm: toNumber(v.heightCm),
      weightKg: toNumber(v.weightKg),
      healthNotes: v.healthNotes.trim(),
    }
    try {
      const saved = isEdit
        ? await updateMember(member.id, { ...payload, status: v.status })
        : await createMember({ ...payload, email: v.email.trim(), password: v.password })
      toast.success(isEdit ? 'Member updated' : 'Member created')
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
          <Input label="Email" value={member.email} disabled readOnly hint="Email cannot be changed here." onChange={() => {}} />
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
        <Select label="Account status" hint="Suspended or inactive members cannot log in." {...register('status')}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </Select>
      ) : (
        <div>
          <PasswordField
            label="Initial password"
            autoComplete="new-password"
            hint="Share it with the member. They can change it after logging in."
            error={errors.password?.message}
            {...register('password', { validate: validatePassword })}
          />
          <PasswordRules value={password} />
        </div>
      )}

      <fieldset className="space-y-4 rounded-xl border border-line p-4">
        <legend className="px-2 text-sm font-semibold">Profile (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Gender" {...register('gender')}>
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
          <Input
            label="Date of birth"
            type="date"
            max={today}
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth', { validate: (v) => !v || v <= today || 'Date of birth cannot be in the future' })}
          />
        </div>
        <Input label="Address" error={errors.address?.message} {...register('address', { maxLength: { value: 255, message: 'Too long' } })} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="City" {...register('city', { maxLength: { value: 80, message: 'Too long' } })} />
          <Input label="State" {...register('state', { maxLength: { value: 80, message: 'Too long' } })} />
          <Input label="Postal code" error={errors.postalCode?.message} {...register('postalCode', { maxLength: { value: 12, message: 'Too long' } })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Emergency contact name" {...register('emergencyContactName', { maxLength: { value: 120, message: 'Too long' } })} />
          <Input
            label="Emergency contact phone"
            type="tel"
            error={errors.emergencyContactPhone?.message}
            {...register('emergencyContactPhone', { pattern: { value: PHONE_RE, message: 'Enter a valid phone number' } })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Height (cm)"
            type="number"
            step="0.1"
            error={errors.heightCm?.message}
            {...register('heightCm', {
              min: { value: 50, message: 'Height must be 50–300 cm' },
              max: { value: 300, message: 'Height must be 50–300 cm' },
            })}
          />
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            error={errors.weightKg?.message}
            {...register('weightKg', {
              min: { value: 20, message: 'Weight must be 20–500 kg' },
              max: { value: 500, message: 'Weight must be 20–500 kg' },
            })}
          />
        </div>
        <Textarea
          label="Health notes"
          rows={3}
          hint="Injuries, medical conditions, allergies. Visible to admins and the assigned trainer."
          error={errors.healthNotes?.message}
          {...register('healthNotes', { maxLength: { value: 2000, message: 'Please keep this under 2000 characters' } })}
        />
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Save changes' : 'Create member'}
        </Button>
      </div>
    </form>
  )
}

export default function MemberFormModal({ open, member, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={member ? 'Edit member' : 'Add member'} size="lg">
      <MemberForm member={member} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  )
}