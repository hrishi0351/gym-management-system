import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import { FullPageSpinner } from './ProtectedRoute.jsx'
import { ROLE_HOME } from '../utils/constants.js'

export default function PublicOnlyRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />
  if (user) {
    const from = location.state?.from
    const target = from?.pathname ? `${from.pathname}${from.search || ''}` : ROLE_HOME[user.role] || '/'
    return <Navigate to={target} replace />
  }
  return <Outlet />
}