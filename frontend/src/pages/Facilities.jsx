import PageHeader from '../components/PageHeader.jsx'
import Section from '../components/Section.jsx'
import Reveal from '../components/Reveal.jsx'
import DataState from '../components/DataState.jsx'
import CtaBanner from '../components/CtaBanner.jsx'
import { CardGridSkeleton } from '../components/Skeleton.jsx'
import FacilityCard from '../components/cards/FacilityCard.jsx'
import useFetch from '../hooks/useFetch.js'
import usePageTitle from '../hooks/usePageTitle.js'
import { fetchFacilities } from '../services/publicService.js'

export default function Facilities() {
  usePageTitle('Gym Facilities')
  const facilities = useFetch(fetchFacilities)

  return (
    <>
      <PageHeader
        eyebrow="Facilities"
        title="Train in comfort"
        subtitle="Everything you need for strength, cardio, recovery and community, under one roof."
      />

      <Section>
        <DataState state={facilities} skeleton={<CardGridSkeleton count={6} height="h-48" />} emptyTitle="Facilities will appear here soon">
          {(data) => (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.map((facility, i) => (
                <Reveal key={facility.id} delay={(i % 4) * 0.06} className="h-full">
                  <FacilityCard facility={facility} />
                </Reveal>
              ))}
            </div>
          )}
        </DataState>
      </Section>

      <CtaBanner title="See it in person" text="Drop by for a tour and find out what a membership includes." />
    </>
  )
}