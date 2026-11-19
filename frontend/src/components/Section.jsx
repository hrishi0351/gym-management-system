import Reveal from './Reveal.jsx'

export default function Section({ id, eyebrow, title, subtitle, tone = 'default', className = '', children }) {
  return (
    <section id={id} className={`${tone === 'alt' ? 'border-y border-line bg-surface' : ''} ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {(title || eyebrow) && (
          <Reveal className="mx-auto mb-10 max-w-2xl text-center">
            {eyebrow && <p className="text-sm font-semibold uppercase tracking-widest text-brand">{eyebrow}</p>}
            {title && <h2 className="mt-2 font-display text-4xl font-extrabold uppercase sm:text-5xl">{title}</h2>}
            {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  )
}