import api from './api.js'

const getter = (path) => async () => {
  const { data } = await api.get(path)
  return data.data
}

export const fetchPlans = getter('/public/plans')
export const fetchTrainers = getter('/public/trainers')
export const fetchClasses = getter('/public/classes')
export const fetchFacilities = getter('/public/facilities')
export const fetchGallery = getter('/public/gallery')

export async function submitEnquiry(payload) {
  const { data } = await api.post('/public/enquiries', payload)
  return data.message
}

export async function submitContact(payload) {
  const { data } = await api.post('/public/contact', payload)
  return data.message
}