import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle.js'
import { buttonClasses } from '../components/ui/buttonStyles.js'

export default function PortalNotFound({ home }) {
  usePageTitle('Page not found')
  return (
    <div className="py-16 text-center">
      <p className="font-display text-7xl font-extrabold text-brand">404</p>
      <p className="mt-2 text-muted">This page does not exist.</p>
      <Link to={home} className={buttonClasses({ className: 'mt-6' })}>
        Back to dashboard
      </Link>
    </div>
  )
}