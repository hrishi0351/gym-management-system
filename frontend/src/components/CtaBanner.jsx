import { Link } from 'react-router-dom'
import { buttonClasses } from './ui/buttonStyles.js'
import Reveal from './Reveal.jsx'

export default function CtaBanner({
  title = 'Ready to start?',
  text = 'Join today and take the first step towards a stronger, healthier you.',
}) {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20">
      <Reveal className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand px-6 py-14 text-center text-on-brand sm:px-12">
        <h2 className="font-display text-4xl font-extrabold uppercase sm:text-6xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl opacity-90">{text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/membership-registration" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
            Join now
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-on-brand/50 px-7 text-base font-semibold text-on-brand transition-colors hover:bg-on-brand/10"
          >
            Talk to us
          </Link>
        </div>
      </Reveal>
    </section>
  )
}