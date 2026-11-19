import PageHeader from '../components/PageHeader.jsx'
import Section from '../components/Section.jsx'
import Reveal from '../components/Reveal.jsx'
import DataState from '../components/DataState.jsx'
import CtaBanner from '../components/CtaBanner.jsx'
import { CardGridSkeleton } from '../components/Skeleton.jsx'
import TrainerCard from '../components/cards/TrainerCard.jsx'
import useFetch from '../hooks/useFetch.js'
import usePageTitle from '../hooks/usePageTitle.js'
import { fetchTrainers } from '../services/publicService.js'

export default function Trainers() {
  usePageTitle('Trainers')
  const trainers = useFetch(fetchTrainers)

  return (
    <>
      <PageHeader
        eyebrow="Our team"
        title="Meet the trainers"
        subtitle="Certified, experienced and genuinely invested in your progress."
      />

      <Section>
        <DataState
          state={trainers}
          skeleton={<CardGridSkeleton count={3} height="h-96" />}
          emptyTitle="Our trainers will appear here soon"
        >
          {(data) => (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((trainer, i) => (
                <Reveal key={trainer.id} delay={(i % 3) * 0.08} className="h-full">
                  <TrainerCard trainer={trainer} />
                </Reveal>
              ))}
            </div>
          )}
        </DataState>
      </Section>

      <CtaBanner title="Want personal training?" text="Talk to us about one-on-one coaching that fits your goals and budget." />
    </>
  )
}