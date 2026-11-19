export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { id: 'lower', label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'digit', label: 'A digit', test: (p) => /\d/.test(p) },
  { id: 'symbol', label: 'A symbol (e.g. ! @ # $)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

/** For react-hook-form `validate`: returns true or an error message. */
export function validatePassword(password) {
  if (!password) return 'Password is required'
  const missing = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.label.toLowerCase())
  if (missing.length) return `Password needs: ${missing.join(', ')}`
  if (new TextEncoder().encode(password).length > 72) return 'Password is too long (max 72 bytes)'
  return true
}