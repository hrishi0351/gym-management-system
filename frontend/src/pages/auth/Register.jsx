import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import Input from '../../components/ui/Input.jsx'
import PasswordField from '../../components/ui/PasswordField.jsx'
import Button from '../../components/ui/Button.jsx'
import FormAlert from '../../components/ui/FormAlert.jsx'
import PasswordRules from '../../components/PasswordRules.jsx'
import useAuth from '../../hooks/useAuth.js'
import usePageTitle from '../../hooks/usePageTitle.js'
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

export default function Register() {
  usePageTitle('Create account')
  const { register: registerUser } = useAuth()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', terms: false },
  })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = async (v) => {
    setFormError('')
    try {
      const user = await registerUser({
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        email: v.email.trim(),
        phone: v.phone.trim() || undefined,
        password: v.password,
      })
      toast.success(`Welcome, ${user.firstName}! Your account is ready.`)
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="font-display text-4xl font-extrabold uppercase">Create account</h1>
      <p className="mt-1 text-sm text-muted">Join us and manage your membership online.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <FormAlert>{formError}</FormAlert>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" autoComplete="given-name" error={errors.firstName?.message} {...register('firstName', nameRules('First name'))} />
          <Input label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register('lastName', nameRules('Last name'))} />
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: EMAIL_RE, message: 'Enter a valid email address' },
          })}
        />

        <Input
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register('phone', { pattern: { value: PHONE_RE, message: 'Enter a valid phone number' } })}
        />

        <div>
          <PasswordField
            label="Password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password', { validate: validatePassword })}
          />
          <PasswordRules value={password} />
        </div>

        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === getValues('password') || 'Passwords do not match',
          })}
        />

        <div>
          <label className="flex items-start gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer accent-brand"
              {...register('terms', { required: 'You must accept the terms to continue' })}
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">Terms</Link>{' '}
              and{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">Privacy Policy</Link>.
            </span>
          </label>
          {errors.terms && <p role="alert" className="mt-1.5 text-sm text-danger">{errors.terms.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand hover:underline">Log in</Link>
      </p>
    </div>
  )
}