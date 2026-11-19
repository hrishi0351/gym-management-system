import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import PasswordField from './ui/PasswordField.jsx'
import Button from './ui/Button.jsx'
import FormAlert from './ui/FormAlert.jsx'
import PasswordRules from './PasswordRules.jsx'
import useAuth from '../hooks/useAuth.js'
import * as authService from '../services/authService.js'
import { applyServerErrors, getErrorMessage } from '../utils/errors.js'
import { validatePassword } from '../utils/passwordPolicy.js'

export default function ChangePasswordCard() {
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
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <h2 className="font-display text-2xl font-bold uppercase">Change password</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
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
    </section>
  )
}