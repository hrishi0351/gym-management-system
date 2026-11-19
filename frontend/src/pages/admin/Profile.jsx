import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import PageHeading from '../../components/admin/PageHeading.jsx'
import ThemeToggle from '../../components/ThemeToggle.jsx'
import PasswordRules from '../../components/PasswordRules.jsx'
import Input from '../../components/ui/Input.jsx'
import PasswordField from '../../components/ui/PasswordField.jsx'
import Button from '../../components/ui/Button.jsx'
import FormAlert from '../../components/ui/FormAlert.jsx'
import { Skeleton } from '../../components/Skeleton.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useAuth from '../../hooks/useAuth.js'
import useFetch from '../../hooks/useFetch.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as authService from '../../services/authService.js'
import { fetchAdminProfile, updateAdminProfile } from '../../services/adminService.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'
import { validatePassword } from '../../utils/passwordPolicy.js'

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/

const nameRules = (label) => ({
  required: `${label} is required`,
  maxLength: { value: 60, message: `${label} must be at most 60 characters` },
  pattern: { value: NAME_RE, message: `${label} contains invalid characters` },
})

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function ProfileForm({ profile }) {
  const { updateUser } = useAuth()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: { firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? '' },
  })

  const onSubmit = async (v) => {
    setFormError('')
    try {
      const saved = await updateAdminProfile({
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        phone: v.phone.trim(),
      })
      updateUser({ firstName: saved.firstName, lastName: saved.lastName, phone: saved.phone }) // refresh the header
      reset({ firstName: saved.firstName, lastName: saved.lastName, phone: saved.phone ?? '' })
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

      <p className="text-sm text-muted">
        Role:{' '}
        <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold capitalize text-brand">{profile.role}</span>
      </p>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const { logout } = useAuth()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })
  const newPassword = useWatch({ control, name: 'newPassword' })

  const onSubmit = async (v) => {
    setFormError('')
    try {
      await authService.changePassword(v.currentPassword, v.newPassword)
      toast.success('Password changed. Please log in again.')
      await logout() // the server ended all sessions; ProtectedRoute then sends you to /login
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert>{formError}</FormAlert>

      <PasswordField
        label="Current password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword', { required: 'Enter your current password' })}
      />

      <div>
        <PasswordField
          label="New password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword', {
            validate: {
              policy: validatePassword,
              different: (value) => value !== getValues('currentPassword') || 'New password must be different from the current one',
            },
          })}
        />
        <PasswordRules value={newPassword} />
      </div>

      <PasswordField
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Please confirm your new password',
          validate: (value) => value === getValues('newPassword') || 'Passwords do not match',
        })}
      />

      <p className="text-sm text-muted">For your safety, changing your password signs you out on every device.</p>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          Change password
        </Button>
      </div>
    </form>
  )
}

export default function Profile() {
  usePageTitle('My Profile')
  const profile = useFetch(fetchAdminProfile)

  return (
    <>
      <PageHeading title="My profile" subtitle="Your admin account details, password and appearance." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          {profile.error ? (
            <ErrorState error={profile.error} onRetry={profile.retry} />
          ) : profile.loading ? (
            <div role="status" aria-label="Loading profile" className="space-y-4">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <span className="sr-only">Loading</span>
            </div>
          ) : (
            <ProfileForm profile={profile.data} />
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Change password">
            <PasswordForm />
          </Card>
          <Card title="Appearance" subtitle="Choose how the site looks. Your choice is remembered on this device.">
            <ThemeToggle />
          </Card>
        </div>
      </div>
    </>
  )
}