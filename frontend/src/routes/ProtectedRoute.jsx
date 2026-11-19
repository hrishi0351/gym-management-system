import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import Spinner from '../components/ui/Spinner.jsx'
import { ROLE_HOME } from '../utils/constants.js'

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-brand">
      <Spinner size={32} label="Loading" />
    </div>
  )
}

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  return <Outlet />
}