import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
const XHR_HEADER = { 'X-Requested-With': 'XMLHttpRequest' } // required by the backend's CSRF check

// ---------- access token lives in memory only ----------
let accessToken = null
export const tokenStore = {
  get: () => accessToken,
  set: (token) => {
    accessToken = token
  },
  clear: () => {
    accessToken = null
  },
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends/receives the httpOnly refresh cookie
  timeout: 15000,
  headers: XHR_HEADER,
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ---------- refresh (single-flight) ----------
let refreshPromise = null

export function refreshSession() {
  if (!refreshPromise) {
    // Plain axios (not `api`) so the response interceptor can never loop
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, null, { withCredentials: true, timeout: 15000, headers: XHR_HEADER })
      .then((res) => {
        const session = res.data.data
        tokenStore.set(session.accessToken)
        return session
      })
      .catch((error) => {
        tokenStore.clear()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// ---------- 401 -> refresh once -> retry ----------
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
]

let onSessionExpired = () => {}
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const skip = NO_REFRESH_PATHS.some((p) => original?.url?.startsWith(p))

    if (status === 401 && original && !original._retried && !skip) {
      original._retried = true
      try {
        const session = await refreshSession()
        original.headers.Authorization = `Bearer ${session.accessToken}`
        return api(original)
      } catch {
        onSessionExpired()
      }
    }
    return Promise.reject(error)
  }
)

export default api