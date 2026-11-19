import api from './api.js'

const unwrap = (response) => response.data.data

/** GET a paginated list. Returns { data, meta }. Empty filters are dropped. */
async function list(path, params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  const { data } = await api.get(path, { params: clean })
  return { data: data.data, meta: data.meta }
}

// ---------- dashboard ----------
export const fetchDashboard = async () => unwrap(await api.get('/admin/dashboard'))

// ---------- members ----------
export const fetchMembers = (params) => list('/admin/members', params)
export const fetchMember = async (id) => unwrap(await api.get(`/admin/members/${id}`))
export const createMember = async (payload) => unwrap(await api.post('/admin/members', payload))
export const updateMember = async (id, payload) => unwrap(await api.put(`/admin/members/${id}`, payload))
export const deleteMember = (id) => api.delete(`/admin/members/${id}`)
export const assignTrainer = (memberId, payload) => api.post(`/admin/members/${memberId}/trainer`, payload)
export const unassignTrainer = (memberId) => api.delete(`/admin/members/${memberId}/trainer`)

// ---------- trainers ----------
export const fetchTrainers = (params) => list('/admin/trainers', params)
export const listAllTrainers = async () => (await fetchTrainers({ limit: 100 })).data
export const createTrainer = async (payload) => unwrap(await api.post('/admin/trainers', payload))
export const updateTrainer = async (id, payload) => unwrap(await api.put(`/admin/trainers/${id}`, payload))
export const deleteTrainer = (id) => api.delete(`/admin/trainers/${id}`)

// ---------- plans ----------
export const listPlans = async () => unwrap(await api.get('/admin/plans'))
export const createPlan = async (payload) => unwrap(await api.post('/admin/plans', payload))
export const updatePlan = async (id, payload) => unwrap(await api.put(`/admin/plans/${id}`, payload))
export const deletePlan = (id) => api.delete(`/admin/plans/${id}`)

// ---------- memberships ----------
export const fetchMemberships = (params) => list('/admin/memberships', params)
export const fetchMembership = async (id) => unwrap(await api.get(`/admin/memberships/${id}`))
export const createMembership = async (payload) => unwrap(await api.post('/admin/memberships', payload))
export const setMembershipStatus = async (id, status) =>
  unwrap(await api.patch(`/admin/memberships/${id}/status`, { status }))

// ---------- payments ----------
export const fetchPayments = (params) => list('/admin/payments', params)
export const recordPayment = async (payload) => unwrap(await api.post('/admin/payments', payload))
export const refundPayment = async (id) => unwrap(await api.patch(`/admin/payments/${id}/status`, { status: 'refunded' }))

// ---------- attendance ----------
export const fetchAttendance = (params) => list('/admin/attendance', params)
export const checkIn = async (payload) => unwrap(await api.post('/admin/attendance/check-in', payload))
export const checkOut = async (memberId) => unwrap(await api.post('/admin/attendance/check-out', { memberId }))

// ---------- classes ----------
export const fetchClasses = (params) => list('/admin/classes', params)
export const fetchClass = async (id) => unwrap(await api.get(`/admin/classes/${id}`))
export const createClass = async (payload) => unwrap(await api.post('/admin/classes', payload))
export const updateClass = async (id, payload) => unwrap(await api.put(`/admin/classes/${id}`, payload))
export const deleteClass = (id) => api.delete(`/admin/classes/${id}`)
export const addSchedule = async (classId, payload) => unwrap(await api.post(`/admin/classes/${classId}/schedules`, payload))
export const removeSchedule = async (scheduleId) => unwrap(await api.delete(`/admin/schedules/${scheduleId}`))
export const fetchClassBookings = async (classId, date) =>
  unwrap(await api.get(`/admin/classes/${classId}/bookings`, { params: date ? { date } : {} }))

// ---------- enquiries ----------
export const fetchEnquiries = (params) => list('/admin/enquiries', params)
export const fetchEnquiry = async (id) => unwrap(await api.get(`/admin/enquiries/${id}`))
export const updateEnquiry = async (id, payload) => unwrap(await api.patch(`/admin/enquiries/${id}`, payload))
export const deleteEnquiry = (id) => api.delete(`/admin/enquiries/${id}`)

// ---------- contact messages ----------
export const fetchContactMessages = (params) => list('/admin/contact-messages', params)
export const fetchContactMessage = async (id) => unwrap(await api.get(`/admin/contact-messages/${id}`)) // also marks it read
export const setContactRead = async (id, isRead) =>
  unwrap(await api.patch(`/admin/contact-messages/${id}/read`, { isRead }))
export const deleteContactMessage = (id) => api.delete(`/admin/contact-messages/${id}`)

// ---------- reports ----------
export const fetchRevenueReport = async ({ from, to, groupBy }) =>
  unwrap(await api.get('/admin/reports/revenue', { params: { from, to, groupBy } }))
export const fetchMembershipsReport = async () => unwrap(await api.get('/admin/reports/memberships'))
export const fetchAttendanceReport = async ({ from, to }) =>
  unwrap(await api.get('/admin/reports/attendance', { params: { from, to } }))
export const fetchMembersReport = async ({ from, to }) =>
  unwrap(await api.get('/admin/reports/members', { params: { from, to } }))

// ---------- activity log ----------
export const fetchActivityLogs = (params) => list('/admin/activity-logs', params)

// ---------- admin profile (password change is authService.changePassword) ----------
export const fetchAdminProfile = async () => unwrap(await api.get('/admin/profile'))
export const updateAdminProfile = async (payload) => unwrap(await api.put('/admin/profile', payload))