import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Section from '../components/Section.jsx'
import Reveal from '../components/Reveal.jsx'
import DataState from '../components/DataState.jsx'
import FilterChips from '../components/FilterChips.jsx'
import WeeklyTimetable from '../components/WeeklyTimetable.jsx'
import CtaBanner from '../components/CtaBanner.jsx'
import { CardGridSkeleton } from '../components/Skeleton.jsx'
import ClassCard from '../components/cards/ClassCard.jsx'
import useFetch from '../hooks/useFetch.js'
import usePageTitle from '../hooks/usePageTitle.js'
import { fetchClasses } from '../services/publicService.js'

function ClassList({ classes }) {
  const [category, setCategory] = useState('All')
  const categories = ['All', ...new Set(classes.map((c) => c.category).filter(Boolean))]
  const visible = category === 'All' ? classes : classes.filter((c) => c.category === category)

  return (
    <>
      {categories.length > 2 && (
        <FilterChips label="Filter classes by category" options={categories} value={category} onChange={setCategory} />
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((cls, i) => (
          <Reveal key={cls.id} delay={(i % 3) * 0.07} className="h-full">
            <ClassCard cls={cls} />
          </Reveal>
        ))}
      </div>
    </>
  )
}

export default function Classes() {
  usePageTitle('Classes and Programs')
  const classes = useFetch(fetchClasses)

  return (
    <>
      <PageHeader
        eyebrow="Classes and programs"
        title="Find your class"
        subtitle="Group classes for every level. Active members can book a spot from their dashboard."
      />

      <Section>
        <DataState state={classes} skeleton={<CardGridSkeleton count={3} height="h-80" />} emptyTitle="Classes will appear here soon">
          {(data) => <ClassList classes={data} />}
        </DataState>
      </Section>

      {classes.data?.length > 0 && (
        <Section eyebrow="Timetable" title="Weekly schedule" tone="alt">
          <WeeklyTimetable classes={classes.data} />
        </Section>
      )}

      <CtaBanner title="Book your first class" text="Become a member and reserve your spot in any class." />
    </>
  )
}