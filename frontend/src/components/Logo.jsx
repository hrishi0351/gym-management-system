import { Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { APP_NAME } from '../utils/constants.js'

// inverted = always-white text, for use on the dark brand panel
export default function Logo({ inverted = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5" aria-label={`${APP_NAME} home`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-on-brand">
        <Dumbbell size={20} aria-hidden="true" />
      </span>
      <span
        className={`font-display text-2xl font-extrabold uppercase tracking-wide ${inverted ? 'text-white' : 'text-fg'}`}
      >
        {APP_NAME}
      </span>
    </Link>
  )
}