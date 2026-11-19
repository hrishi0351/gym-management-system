import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AuthContext from './authContext.js'
import * as authService from '../services/authService.js'
import { refreshSession, setSessionExpiredHandler } from '../services/api.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while we check for an existing session

  // Restore the session on first load
  useEffect(() => {
    let active = true
    refreshSession()
      .then((session) => {
        if (active) setUser(session.user)
      })
      .catch(() => {
        if (active) setUser(null) // not logged in
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // If a refresh fails later, the API layer tells us so we can log the user out
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null)
      toast.error('Your session has expired. Please log in again.', { id: 'session-expired' })
    })
    return () => setSessionExpiredHandler(() => {})
  }, [])

  const login = useCallback(async (email, password) => {
    const loggedIn = await authService.login(email, password)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback(async (payload) => {
    const created = await authService.register(payload)
    setUser(created)
    return created
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      /* even if the server call fails, log out locally */
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, login, register, logout }),
    [user, loading, login, register, logout]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}