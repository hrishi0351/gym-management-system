import api, { tokenStore } from './api.js'

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  tokenStore.set(data.data.accessToken)
  return data.data.user
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload)
  tokenStore.set(data.data.accessToken)
  return data.data.user
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    tokenStore.clear()
  }
}

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data.data
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data.message
}

export async function resetPassword(token, newPassword) {
  const { data } = await api.post('/auth/reset-password', { token, newPassword })
  return data.message
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
  return data.message
}