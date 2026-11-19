import { Check } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Section from '../components/Section.jsx'
import Reveal from '../components/Reveal.jsx'
import DynamicIcon from '../components/DynamicIcon.jsx'
import CtaBanner from '../components/CtaBanner.jsx'
import usePageTitle from '../hooks/usePageTitle.js'
import { ABOUT } from '../utils/content.js'
import { APP_NAME } from '../utils/constants.js'

export default function About() {
  usePageTitle('About Us')

  return (
    <>
      <PageHeader
        eyebrow="About us"
        title={`This is ${APP_NAME}`}
        subtitle="A gym built around coaching, community and consistency."
      />

      <Section eyebrow="Our story" title="Why we exist">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-4 text-muted">
              {ABOUT.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <h3 className="font-display text-2xl font-bold uppercase">What you can expect</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {ABOUT.included.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section eyebrow="Our values" title="What drives us" tone="alt">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT.values.map((value, i) => (
            <Reveal key={value.title} delay={i * 0.07} className="h-full">
              <div className="h-full rounded-2xl border border-line bg-page p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <DynamicIcon name={value.icon} size={24} />
                </span>
                <h3 className="mt-4 font-display text-2xl font-bold uppercase">{value.title}</h3>
                <p className="mt-2 text-sm text-muted">{value.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBanner title="Come and see for yourself" text="Visit the gym, meet the coaches and find the plan that fits you." />
    </>
  )
}