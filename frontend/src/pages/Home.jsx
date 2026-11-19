import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Quote } from 'lucide-react'
import Section from '../components/Section.jsx'
import Reveal from '../components/Reveal.jsx'
import DataState from '../components/DataState.jsx'
import DynamicIcon from '../components/DynamicIcon.jsx'
import CtaBanner from '../components/CtaBanner.jsx'
import { CardGridSkeleton } from '../components/Skeleton.jsx'
import PlanCard from '../components/cards/PlanCard.jsx'
import TrainerCard from '../components/cards/TrainerCard.jsx'
import ClassCard from '../components/cards/ClassCard.jsx'
import FacilityCard from '../components/cards/FacilityCard.jsx'
import { buttonClasses } from '../components/ui/buttonStyles.js'
import useFetch from '../hooks/useFetch.js'
import usePageTitle from '../hooks/usePageTitle.js'
import { fetchClasses, fetchFacilities, fetchPlans, fetchTrainers } from '../services/publicService.js'
import { pickFeaturedPlans } from '../utils/format.js'
import { HOME_FEATURES, TESTIMONIALS } from '../utils/content.js'
import { APP_NAME } from '../utils/constants.js'

function SeeAll({ to, children }) {
  return (
    <div className="mt-10 text-center">
      <Link to={to} className={buttonClasses({ variant: 'secondary' })}>
        {children} <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  )
}

export default function Home() {
  usePageTitle('Home')
  const plans = useFetch(fetchPlans)
  const trainers = useFetch(fetchTrainers)
  const classes = useFetch(fetchClasses)
  const facilities = useFetch(fetchFacilities)

  // Real numbers from your own data (shows "–" while loading or if a request fails)
  const stats = [
    { label: 'Expert trainers', value: trainers.data?.length },
    { label: 'Weekly class slots', value: classes.data?.reduce((n, c) => n + c.schedules.length, 0) },
    { label: 'Facilities', value: facilities.data?.length },
    { label: 'Membership plans', value: plans.data?.length },
  ]

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">Welcome to {APP_NAME}</p>
            <h1 className="mt-4 font-display text-6xl font-extrabold uppercase leading-none sm:text-8xl">
              Build the <span className="text-brand">strongest</span> version of you
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Premium equipment, motivating classes and coaches who care. Join today and start your transformation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/membership-registration" className={buttonClasses({ size: 'lg' })}>Join now</Link>
              <Link to="/plans" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>View plans</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-2"
          >
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-widest text-muted">At a glance</p>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-surface-2 p-4">
                    <dt className="text-xs text-muted">{stat.label}</dt>
                    <dd className="font-display text-5xl font-extrabold text-brand">{stat.value ?? '–'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Why us ---------- */}
      <Section eyebrow="Why choose us" title="Everything you need to succeed" tone="alt">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 0.07} className="h-full">
              <div className="h-full rounded-2xl border border-line bg-page p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <DynamicIcon name={feature.icon} size={24} />
                </span>
                <h3 className="mt-4 font-display text-2xl font-bold uppercase">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted">{feature.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------- Plans ---------- */}
      <Section eyebrow="Membership" title="Simple, flexible plans" subtitle="Pick the plan that fits your routine. Longer plans cost less per month.">
        <DataState state={plans} skeleton={<CardGridSkeleton count={3} className="md:grid-cols-3" height="h-96" />}>
          {(data) => (
            <div className="grid gap-6 pt-3 md:grid-cols-3">
              {pickFeaturedPlans(data).map((plan, i) => (
                <Reveal key={plan.id} delay={i * 0.08} className="h-full">
                  <PlanCard plan={plan} />
                </Reveal>
              ))}
            </div>
          )}
        </DataState>
        <SeeAll to="/plans">Compare all plans</SeeAll>
      </Section>

      {/* ---------- Classes ---------- */}
      <Section eyebrow="Classes" title="Train together" subtitle="From calming yoga to high-energy HIIT." tone="alt">
        <DataState state={classes} emptyTitle="Classes coming soon">
          {(data) => (
            <div className="grid gap-6 md:grid-cols-3">
              {data.slice(0, 3).map((cls, i) => (
                <Reveal key={cls.id} delay={i * 0.08} className="h-full">
                  <ClassCard cls={cls} />
                </Reveal>
              ))}
            </div>
          )}
        </DataState>
        <SeeAll to="/classes">See the full timetable</SeeAll>
      </Section>

      {/* ---------- Trainers ---------- */}
      <Section eyebrow="Our team" title="Coaches who care about your progress">
        <DataState state={trainers} skeleton={<CardGridSkeleton count={4} className="sm:grid-cols-2 lg:grid-cols-4" height="h-80" />} emptyTitle="Trainers coming soon">
          {(data) => (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.slice(0, 4).map((trainer, i) => (
                <Reveal key={trainer.id} delay={i * 0.07} className="h-full">
                  <TrainerCard trainer={trainer} />
                </Reveal>
              ))}
            </div>
          )}
        </DataState>
        <SeeAll to="/trainers">Meet all trainers</SeeAll>
      </Section>

      {/* ---------- Facilities ---------- */}
      <Section eyebrow="Facilities" title="Built for every workout" tone="alt">
        <DataState state={facilities} skeleton={<CardGridSkeleton count={4} className="sm:grid-cols-2 lg:grid-cols-4" height="h-48" />}>
          {(data) => (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.slice(0, 4).map((facility, i) => (
                <Reveal key={facility.id} delay={i * 0.07} className="h-full">
                  <FacilityCard facility={facility} />
                </Reveal>
              ))}
            </div>
          )}
        </DataState>
        <SeeAll to="/facilities">Explore all facilities</SeeAll>
      </Section>

      {/* ---------- Testimonials (sample text, see utils/content.js) ---------- */}
      <Section eyebrow="Member stories" title="What our members say">
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08} className="h-full">
              <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm">
                <Quote size={24} className="text-brand" aria-hidden="true" />
                <blockquote className="mt-3 flex-1 text-sm text-muted">{t.text}</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">
                  {t.name} <span className="font-normal text-muted">· Member</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBanner />
    </>
  )
}