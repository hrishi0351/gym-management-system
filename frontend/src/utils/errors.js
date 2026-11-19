/** Safe, user-friendly message from an Axios error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const serverMessage = error?.response?.data?.message
  if (serverMessage) return serverMessage
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Please check that the backend is running.'
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
  return fallback
}

/**
 * Puts the backend's field errors ([{ field, message }]) onto react-hook-form fields.
 * Returns true if at least one field error was applied.
 */
export function applyServerErrors(error, setError) {
  const list = error?.response?.data?.errors
  if (!Array.isArray(list)) return false
  let applied = false
  list.forEach(({ field, message }) => {
    if (field) {
      setError(field, { type: 'server', message })
      applied = true
    }
  })
  return applied
}