import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import FormAlert from '../../components/ui/FormAlert.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as authService from '../../services/authService.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  usePageTitle('Forgot password')
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } })

  const onSubmit = async ({ email }) => {
    setFormError('')
    try {
      await authService.forgotPassword(email.trim())
      setSent(true)
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="font-display text-4xl font-extrabold uppercase">Forgot password</h1>

      {sent ? (
        <div className="mt-4 space-y-4">
          <FormAlert variant="success">
            If an account with that email exists, we have sent a link to reset your password. It expires in 30 minutes.
          </FormAlert>
          {import.meta.env.DEV && (
            <FormAlert variant="info">
              Development mode: no email is sent. Copy the reset link from the <strong>backend terminal</strong>.
            </FormAlert>
          )}
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">Enter your email and we will send you a reset link.</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <FormAlert>{formError}</FormAlert>
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
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              Send reset link
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-semibold text-brand hover:underline">← Back to login</Link>
      </p>
    </div>
  )
}