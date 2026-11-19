import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Section from '../components/Section.jsx'
import DataState from '../components/DataState.jsx'
import FilterChips from '../components/FilterChips.jsx'
import SmartImage from '../components/SmartImage.jsx'
import { CardGridSkeleton } from '../components/Skeleton.jsx'
import useFetch from '../hooks/useFetch.js'
import usePageTitle from '../hooks/usePageTitle.js'
import { fetchGallery } from '../services/publicService.js'

function Lightbox({ items, index, onClose, onChange }) {
  const item = items[index]
  const closeRef = useRef(null)
  const count = items.length

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onChange((index + 1) % count)
      if (event.key === 'ArrowLeft') onChange((index - 1 + count) % count)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // stop the page scrolling behind the dialog
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [index, count, onClose, onChange])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    >
      <div onClick={(event) => event.stopPropagation()} className="relative w-full max-w-4xl">
        <SmartImage
          src={item.imageUrl}
          alt={item.title}
          className="aspect-video max-h-[75vh] w-full rounded-2xl bg-surface object-contain"
        />
        <p className="mt-3 text-center text-sm text-white">
          {item.title} <span className="opacity-70">({index + 1} of {count})</span>
        </p>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface text-fg shadow-lg"
        >
          <X size={20} aria-hidden="true" />
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => onChange((index - 1 + count) % count)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface text-fg shadow-lg"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onChange((index + 1) % count)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface text-fg shadow-lg"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function GalleryGrid({ images }) {
  const [category, setCategory] = useState('All')
  const [openIndex, setOpenIndex] = useState(null)
  const close = useCallback(() => setOpenIndex(null), [])

  const categories = ['All', ...new Set(images.map((i) => i.category).filter(Boolean))]
  const items = category === 'All' ? images : images.filter((i) => i.category === category)

  const chooseCategory = (next) => {
    setCategory(next)
    setOpenIndex(null)
  }

  return (
    <>
      {categories.length > 2 && (
        <FilterChips label="Filter photos by category" options={categories} value={category} onChange={chooseCategory} />
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`View photo: ${image.title}`}
              className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-line"
            >
              <SmartImage
                src={image.imageUrl}
                alt={image.title}
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-8 text-left text-sm font-medium text-white">
                {image.title}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && items[openIndex] && (
        <Lightbox items={items} index={openIndex} onClose={close} onChange={setOpenIndex} />
      )}
    </>
  )
}

export default function Gallery() {
  usePageTitle('Gallery')
  const gallery = useFetch(fetchGallery)

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Life at the gym"
        subtitle="A look at our floor, our classes and our community."
      />
      <Section>
        <DataState
          state={gallery}
          skeleton={<CardGridSkeleton count={8} className="sm:grid-cols-2 lg:grid-cols-4" height="h-44" />}
          emptyTitle="Photos coming soon"
        >
          {(data) => <GalleryGrid images={data} />}
        </DataState>
      </Section>
    </>
  )
}