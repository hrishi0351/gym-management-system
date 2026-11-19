import PageHeader from '../components/PageHeader.jsx'
import Section from '../components/Section.jsx'
import Reveal from '../components/Reveal.jsx'
import DataState from '../components/DataState.jsx'
import Faq from '../components/Faq.jsx'
import CtaBanner from '../components/CtaBanner.jsx'
import { CardGridSkeleton } from '../components/Skeleton.jsx'
import PlanCard from '../components/cards/PlanCard.jsx'
import useFetch from '../hooks/useFetch.js'
import usePageTitle from '../hooks/usePageTitle.js'
import { fetchPlans } from '../services/publicService.js'
import { PLAN_FAQS } from '../utils/content.js'

export default function Plans() {
  usePageTitle('Membership Plans')
  const plans = useFetch(fetchPlans)

  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Plans and pricing"
        subtitle="Choose the plan that fits your routine. Every plan includes full access to the gym floor."
      />

      <Section>
        <DataState
          state={plans}
          skeleton={<CardGridSkeleton count={3} className="md:grid-cols-2 lg:grid-cols-3" height="h-96" />}
          emptyTitle="Plans coming soon"
          emptyText="Please contact the front desk for current membership options."
        >
          {(data) => (
            <div className="grid gap-6 pt-3 md:grid-cols-2 lg:grid-cols-3">
              {data.map((plan, i) => (
                <Reveal key={plan.id} delay={(i % 3) * 0.08} className="h-full">
                  <PlanCard plan={plan} />
                </Reveal>
              ))}
            </div>
          )}
        </DataState>
      </Section>

      <Section eyebrow="Questions" title="Frequently asked" tone="alt">
        <Faq items={PLAN_FAQS} />
      </Section>

      <CtaBanner />
    </>
  )
}