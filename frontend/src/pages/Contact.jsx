import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Section from '../components/Section.jsx'
import Reveal from '../components/Reveal.jsx'
import Input from '../components/ui/Input.jsx'
import Textarea from '../components/ui/Textarea.jsx'
import Button from '../components/ui/Button.jsx'
import FormAlert from '../components/ui/FormAlert.jsx'
import usePageTitle from '../hooks/usePageTitle.js'
import { submitContact } from '../services/publicService.js'
import { applyServerErrors, getErrorMessage } from '../utils/errors.js'
import { CONTACT } from '../utils/constants.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`
const telUrl = `tel:${CONTACT.phone.replace(/[^\d+]/g, '')}`

const INFO = [
  { Icon: MapPin, title: 'Address', text: CONTACT.address, href: mapsUrl, linkLabel: 'Open in Google Maps' },
  { Icon: Phone, title: 'Phone', text: CONTACT.phone, href: telUrl, linkLabel: 'Call us' },
  { Icon: Mail, title: 'Email', text: CONTACT.email, href: `mailto:${CONTACT.email}`, linkLabel: 'Send an email' },
  { Icon: Clock, title: 'Opening hours', text: CONTACT.hours },
]

function ContactForm() {
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', email: '', subject: '', message: '', website: '' } })

  const onSubmit = async (v) => {
    setFormError('')
    try {
      await submitContact({
        name: v.name.trim(),
        email: v.email.trim(),
        subject: v.subject.trim(),
        message: v.message.trim(),
        website: v.website, // honeypot: real visitors leave this empty
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
        <h3 className="mt-3 font-display text-3xl font-bold uppercase text-success">Message sent</h3>
        <p className="mt-2 text-sm text-success">Thank you! We will get back to you as soon as possible.</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <FormAlert>{formError}</FormAlert>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Your name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
            maxLength: { value: 120, message: 'Name must be at most 120 characters' },
          })}
        />
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
      </div>

      <Input
        label="Subject"
        error={errors.subject?.message}
        {...register('subject', {
          required: 'Subject is required',
          minLength: { value: 3, message: 'Subject must be at least 3 characters' },
          maxLength: { value: 200, message: 'Subject must be at most 200 characters' },
        })}
      />

      <Textarea
        label="Message"
        rows={6}
        hint="10 to 2000 characters"
        error={errors.message?.message}
        {...register('message', {
          required: 'Message is required',
          minLength: { value: 10, message: 'Message must be at least 10 characters' },
          maxLength: { value: 2000, message: 'Message must be at most 2000 characters' },
        })}
      />

      {/* Honeypot: hidden from people, filled by bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Send message
      </Button>
    </form>
  )
}

export default function Contact() {
  usePageTitle('Contact Us')

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        subtitle="Questions about plans, classes or a visit? Send us a message and we will reply soon."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-5">
          <Reveal className="space-y-4 lg:col-span-2">
            {INFO.map(({ Icon, title, text, href, linkLabel }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                  {href && (
                    <a
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="mt-1 inline-block text-sm font-semibold text-brand hover:underline"
                    >
                      {linkLabel}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-3">
            <ContactForm />
          </Reveal>
        </div>
      </Section>
    </>
  )
}