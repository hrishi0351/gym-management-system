import { motion } from 'framer-motion'

export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="relative overflow-hidden border-b border-line bg-surface">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
      >
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-widest text-brand">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-5xl font-extrabold uppercase sm:text-7xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-muted">{subtitle}</p>}
      </motion.div>
    </header>
  )
}