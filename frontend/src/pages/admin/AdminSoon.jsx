import { Link } from 'react-router-dom'
import PageHeading from '../../components/admin/PageHeading.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import { buttonClasses } from '../../components/ui/buttonStyles.js'

export default function AdminSoon({ title }) {
  usePageTitle(title)
  return (
    <>
      <PageHeading title={title} />
      <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
        <p className="font-semibold">This section is built in the next part (Phase 4C-2).</p>
        <p className="mt-1 text-sm text-muted">Members, trainers and plans are ready to use now.</p>
        <Link to="/admin" className={buttonClasses({ variant: 'secondary', className: 'mt-6' })}>
          Back to dashboard
        </Link>
      </div>
    </>
  )
}

export function AdminNotFound() {
  usePageTitle('Page not found')
  return (
    <div className="py-16 text-center">
      <p className="font-display text-7xl font-extrabold text-brand">404</p>
      <p className="mt-2 text-muted">This admin page does not exist.</p>
      <Link to="/admin" className={buttonClasses({ className: 'mt-6' })}>
        Back to dashboard
      </Link>
    </div>
  )
}