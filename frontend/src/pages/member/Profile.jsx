import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import PageHeading from '../../components/admin/PageHeading.jsx'
import Boundary from '../../components/portal/Boundary.jsx'
import ChangePasswordCard from '../../components/ChangePasswordCard.jsx'
import ThemeToggle from '../../components/ThemeToggle.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Textarea from '../../components/ui/Textarea.jsx'
import Button from '../../components/ui/Button.jsx'
import FormAlert from '../../components/ui/FormAlert.jsx'
import useAuth from '../../hooks/useAuth.js'
import useFetch from '../../hooks/useFetch.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchMyProfile, updateMyProfile } from '../../services/portalService.js'
import { todayLocal } from '../../utils/dateTime.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/

const nameRules = (label) => ({
  required: `${label} is required`,
  maxLength: { value: 60, message: `${label} must be at most 60 characters` },
  pattern: { value: NAME_RE, message: `${label} contains invalid characters` },
})

const toForm = (m) => ({
  firstName: m.firstName ?? '',
  lastName: m.lastName ?? '',
  phone: m.phone ?? '',
  gender: m.gender ?? '',
  dateOfBirth: m.dateOfBirth ?? '',
  address: m.address ?? '',
  city: m.city ?? '',
  state: m.state ?? '',
  postalCode: m.postalCode ?? '',
  emergencyContactName: m.emergencyContactName ?? '',
  emergencyContactPhone: m.emergencyContactPhone ?? '',
  heightCm: m.heightCm ?? '',
  weightKg: m.weightKg ?? '',
  healthNotes: m.healthNotes ?? '',
})

const toNumber = (value) => (value === '' || value == null ? '' : Number(value))

function ProfileForm({ profile }) {
  const { updateUser } = useAuth()
  const [today] = useState(todayLocal)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ defaultValues: toForm(profile) })

  const onSubmit = async (v) => {
    setFormError('')
    try {
      const saved = await updateMyProfile({
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
      })
      updateUser({ firstName: saved.firstName, lastName: saved.lastName, phone: saved.phone }) // refresh the header
      reset(toForm(saved))
      toast.success('Profile updated')
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert>{formError}</FormAlert>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" autoComplete="given-name" error={errors.firstName?.message} {...register('firstName', nameRules('First name'))} />
        <Input label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register('lastName', nameRules('Last name'))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" value={profile.email} readOnly disabled hint="Your login email cannot be changed here." onChange={() => {}} />
        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone', { pattern: { value: PHONE_RE, message: 'Enter a valid phone number' } })}
        />
      </div>

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
        hint="Injuries, medical conditions, allergies. Shared with your assigned trainer and the gym staff."
        error={errors.healthNotes?.message}
        {...register('healthNotes', { maxLength: { value: 2000, message: 'Please keep this under 2000 characters' } })}
      />

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

export default function MemberProfile() {
  usePageTitle('My Profile')
  const state = useFetch(fetchMyProfile)

  return (
    <>
      <PageHeading title="My profile" subtitle="Your details, password and appearance." />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm lg:col-span-3">
          <h2 className="font-display text-2xl font-bold uppercase">Personal details</h2>
          <div className="mt-5">
            <Boundary state={state}>{(profile) => <ProfileForm profile={profile} />}</Boundary>
          </div>
        </section>

        <div className="space-y-6 lg:col-span-2">
          <ChangePasswordCard />
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <h2 className="font-display text-2xl font-bold uppercase">Appearance</h2>
            <p className="mt-1 text-sm text-muted">Your choice is remembered on this device.</p>
            <div className="mt-4">
              <ThemeToggle />
            </div>
          </section>
        </div>
      </div>
    </>
  )
}