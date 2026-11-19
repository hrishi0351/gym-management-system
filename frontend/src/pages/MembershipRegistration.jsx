import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Section from '../components/Section.jsx'
import Reveal from '../components/Reveal.jsx'
import DataState from '../components/DataState.jsx'
import { Skeleton } from '../components/Skeleton.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Textarea from '../components/ui/Textarea.jsx'
import Button from '../components/ui/Button.jsx'
import FormAlert from '../components/ui/FormAlert.jsx'
import { buttonClasses } from '../components/ui/buttonStyles.js'
import useFetch from '../hooks/useFetch.js'
import usePageTitle from '../hooks/usePageTitle.js'
import { fetchPlans, submitEnquiry } from '../services/publicService.js'
import { applyServerErrors, getErrorMessage } from '../utils/errors.js'
import { formatCurrency, formatDuration } from '../utils/format.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/
const GOALS = ['Lose weight', 'Build muscle', 'Improve general fitness', 'Increase strength', 'Flexibility and mobility', 'Other']

const STEPS = [
  { title: 'Choose a plan', text: 'Pick the membership that suits your routine.' },
  { title: 'Send your request', text: 'Fill in the form. It takes less than a minute.' },
  { title: 'We contact you', text: 'Our team calls you, creates your membership and records your payment at the front desk.' },
  { title: 'Start training', text: 'Your membership activates on your start date, and you can log in to track everything online.' },
]

function RequestForm({ plans, initialPlanId }) {
  const [today] = useState(() => new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD in the visitor's timezone
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', phone: '', planId: initialPlanId, startDate: '', goal: '', notes: '', website: '' },
  })

  const onSubmit = async (v) => {
    setFormError('')
    const parts = ['Membership request.']
    if (v.goal) parts.push(`Goal: ${v.goal}.`)
    if (v.startDate) parts.push(`Preferred start date: ${v.startDate}.`)
    if (v.notes.trim()) parts.push(`Notes: ${v.notes.trim()}`)

    try {
      await submitEnquiry({
        name: v.name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        planId: Number(v.planId),
        message: parts.join(' ').slice(0, 1000),
        website: v.website, // honeypot
      })
      reset()
      setSent(true)
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  if (sent) {
    return (
      <div role="status" className="rounded-2xl border border-success/30 bg-success-soft p-8 text-center">
        <CheckCircle2 size={40} className="mx-auto text-success" aria-hidden="true" />
        <h3 className="mt-3 font-display text-3xl font-bold uppercase text-success">Request received</h3>
        <p className="mt-2 text-sm text-success">
          Thank you! Our team will contact you shortly to complete your membership.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/register" className={buttonClasses()}>Create your online account</Link>
          <Button variant="secondary" onClick={() => setSent(false)}>Send another request</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <FormAlert>{formError}</FormAlert>

      <Select
        label="Membership plan"
        error={errors.planId?.message}
        {...register('planId', { required: 'Please choose a plan' })}
      >
        <option value="">Select a plan</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name} – {formatCurrency(plan.price)} / {formatDuration(plan.durationDays)}
          </option>
        ))}
      </Select>

      <Input
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name', {
          required: 'Name is required',
          minLength: { value: 2, message: 'Name must be at least 2 characters' },
          maxLength: { value: 120, message: 'Name must be at most 120 characters' },
        })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: EMAIL_RE, message: 'Enter a valid email address' },
          })}
        />
        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register('phone', {
            required: 'Phone is required so we can reach you',
            pattern: { value: PHONE_RE, message: 'Enter a valid phone number' },
          })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Preferred start date (optional)"
          type="date"
          min={today}
          error={errors.startDate?.message}
          {...register('startDate', {
            validate: (value) => !value || value >= today || 'Start date cannot be in the past',
          })}
        />
        <Select label="Main goal (optional)" {...register('goal')}>
          <option value="">Select a goal</option>
          {GOALS.map((goal) => (
            <option key={goal} value={goal}>{goal}</option>
          ))}
        </Select>
      </div>

      <Textarea
        label="Anything else we should know? (optional)"
        rows={3}
        hint="For example: injuries, preferred timings, questions."
        error={errors.notes?.message}
        {...register('notes', { maxLength: { value: 500, message: 'Please keep this under 500 characters' } })}
      />

      {/* Honeypot: hidden from people, filled by bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Send membership request
      </Button>
      <p className="text-center text-xs text-muted">
        By submitting you agree to be contacted about your request. See our{' '}
        <Link to="/privacy" className="font-medium text-brand hover:underline">Privacy Policy</Link>.
      </p>
    </form>
  )
}

export default function MembershipRegistration() {
  usePageTitle('Membership Registration')
  const plans = useFetch(fetchPlans)
  const [params] = useSearchParams()
  const requested = params.get('plan') || ''

  return (
    <>
      <PageHeader
        eyebrow="Join us"
        title="Membership registration"
        subtitle="Tell us which plan you want and we will take care of the rest."
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <h2 className="font-display text-3xl font-bold uppercase">How it works</h2>
            <ol className="mt-5 space-y-5">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-on-brand">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-0.5 text-sm text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-muted">
              Already a member?{' '}
              <Link to="/login" className="font-semibold text-brand hover:underline">Log in</Link>
            </p>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-3">
            <DataState
              state={plans}
              skeleton={<Skeleton className="h-[34rem] rounded-2xl" />}
              emptyTitle="Plans are not available right now"
              emptyText="Please contact the front desk to join."
            >
              {(data) => (
                <RequestForm
                  plans={data}
                  initialPlanId={data.some((p) => String(p.id) === requested) ? requested : ''}
                />
              )}
            </DataState>
          </Reveal>
        </div>
      </Section>
    </>
  )
}