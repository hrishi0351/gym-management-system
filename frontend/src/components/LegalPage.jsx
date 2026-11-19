import PageHeader from './PageHeader.jsx'
import usePageTitle from '../hooks/usePageTitle.js'
import { LEGAL } from '../utils/content.js'

export default function LegalPage({ title, intro, sections }) {
  usePageTitle(title)
  return (
    <>
      <PageHeader eyebrow="Legal" title={title} subtitle={`Last updated: ${LEGAL.updated}`} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-muted">{intro}</p>
        <div className="mt-10 space-y-10">
          {sections.map((section, index) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl font-bold uppercase">
                {index + 1}. {section.heading}
              </h2>
              {section.paragraphs?.map((p) => (
                <p key={p} className="mt-3 text-sm leading-relaxed text-muted">{p}</p>
              ))}
              {section.list && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  )
}