import api from './api.js'

const unwrap = (response) => response.data.data

/** GET a paginated list. Returns { data, meta }. Empty filters are dropped. */
async function list(path, params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  const { data } = await api.get(path, { params: clean })
  return { data: data.data, meta: data.meta }
}

// ===================== member =====================
export const fetchMyProfile = async () => unwrap(await api.get('/member/profile'))
export const updateMyProfile = async (payload) => unwrap(await api.put('/member/profile', payload))
export const fetchMyMemberships = async () => unwrap(await api.get('/member/memberships')) // { current, history }
export const fetchMyTrainer = async () => unwrap(await api.get('/member/trainer'))
export const fetchMyPayments = (params) => list('/member/payments', params)
export const fetchMyAttendance = (params) => list('/member/attendance', params)
export const fetchAvailability = async (date) => unwrap(await api.get('/member/classes/availability', { params: { date } }))
export const fetchMyBookings = (params) => list('/member/bookings', params)
export const bookClass = async (payload) => unwrap(await api.post('/member/bookings', payload))
export const cancelBooking = async (id) => unwrap(await api.delete(`/member/bookings/${id}`))

// ===================== trainer =====================
export const fetchTrainerProfile = async () => unwrap(await api.get('/trainer/profile'))
export const updateTrainerProfile = async (payload) => unwrap(await api.put('/trainer/profile', payload))
export const fetchTrainerMembers = (params) => list('/trainer/members', params)
export const fetchTrainerMember = async (id) => unwrap(await api.get(`/trainer/members/${id}`))
export const fetchTrainerClasses = async () => unwrap(await api.get('/trainer/classes'))
export const updateTrainerClass = async (id, payload) => unwrap(await api.put(`/trainer/classes/${id}`, payload))
export const addTrainerSchedule = async (classId, payload) =>
  unwrap(await api.post(`/trainer/classes/${classId}/schedules`, payload)) // returns the updated class
export const removeTrainerSchedule = async (scheduleId) => unwrap(await api.delete(`/trainer/schedules/${scheduleId}`)) // returns the updated class
export const fetchTrainerClassBookings = async (classId, date) =>
  unwrap(await api.get(`/trainer/classes/${classId}/bookings`, { params: date ? { date } : {} }))