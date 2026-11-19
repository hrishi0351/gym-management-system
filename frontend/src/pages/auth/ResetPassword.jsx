import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import PasswordField from '../../components/ui/PasswordField.jsx'
import Button from '../../components/ui/Button.jsx'
import FormAlert from '../../components/ui/FormAlert.jsx'
import PasswordRules from '../../components/PasswordRules.jsx'
import useAuth from '../../hooks/useAuth.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as authService from '../../services/authService.js'
import { validatePassword } from '../../utils/passwordPolicy.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'

export default function ResetPassword() {
  usePageTitle('Reset password')
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const tokenLooksValid = /^[0-9a-f]{64}$/i.test(token)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: { newPassword: '', confirmPassword: '' } })
  const newPassword = useWatch({ control, name: 'newPassword' })

  const onSubmit = async (v) => {
    setFormError('')
    try {
      await authService.resetPassword(token, v.newPassword)
      await logout() // the server ended all sessions, so clear the local one too
      toast.success('Password reset. Please log in with your new password.')
      navigate('/login', { replace: true })
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  if (!tokenLooksValid) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-4xl font-extrabold uppercase">Invalid link</h1>
        <div className="mt-4">
          <FormAlert>This password reset link is invalid or incomplete. Please request a new one.</FormAlert>
        </div>
        <Link to="/forgot-password" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="font-display text-4xl font-extrabold uppercase">Set new password</h1>
      <p className="mt-1 text-sm text-muted">Choose a strong password you have not used before.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <FormAlert>{formError}</FormAlert>
        <div>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword', { validate: validatePassword })}
          />
          <PasswordRules value={newPassword} />
        </div>
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === getValues('newPassword') || 'Passwords do not match',
          })}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </div>
  )
}