import { useCallback, useState } from 'react'
import { daysBetween, shiftDate, todayLocal } from '../utils/dateTime.js'

export const PRESETS = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: '365d', label: 'Last 12 months', days: 365 },
  { id: 'custom', label: 'Custom range' },
]
const MAX_DAYS = 731 // the backend rejects longer ranges

function rangeFor(presetId, today) {
  const preset = PRESETS.find((p) => p.id === presetId)
  return { from: shiftDate(today, -(preset.days - 1)), to: today }
}

export default function useDateRange(defaultPreset = '30d') {
  const [today] = useState(todayLocal)
  const [state, setState] = useState(() => ({ preset: defaultPreset, ...rangeFor(defaultPreset, today) }))

  const choosePreset = useCallback(
    (preset) => setState((s) => (preset === 'custom' ? { ...s, preset } : { preset, ...rangeFor(preset, today) })),
    [today]
  )
  const setFrom = useCallback((from) => setState((s) => ({ ...s, preset: 'custom', from })), [])
  const setTo = useCallback((to) => setState((s) => ({ ...s, preset: 'custom', to })), [])

  let error = ''
  if (!state.from || !state.to) error = 'Choose both dates'
  else if (state.from > state.to) error = '"From" must be on or before "To"'
  else if (daysBetween(state.from, state.to) > MAX_DAYS) error = 'The range cannot exceed 2 years'

  return { ...state, today, error, choosePreset, setFrom, setTo }
}