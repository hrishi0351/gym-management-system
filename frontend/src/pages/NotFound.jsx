import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle.js'
import { buttonClasses } from '../components/ui/buttonStyles.js'

export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="font-display text-8xl font-extrabold text-brand">404</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold uppercase">Page not found</h1>
      <p className="mt-4 text-muted">The page you are looking for does not exist or was moved.</p>
      <Link to="/" className={buttonClasses({ className: 'mt-8' })}>
        Back to home
      </Link>
    </section>
  )
}