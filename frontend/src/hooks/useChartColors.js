import useTheme from './useTheme.js'

const PALETTE = {
  light: {
    brand: '#c2410c', grid: '#dfe3e9', text: '#596275', surface: '#ffffff', fg: '#0f172a',
    status: { active: '#15803d', pending: '#a16207', expired: '#b91c1c', cancelled: '#64748b', frozen: '#0369a1' },
  },
  dark: {
    brand: '#fb923c', grid: '#263142', text: '#9aa6b8', surface: '#131a24', fg: '#eef2f7',
    status: { active: '#4ade80', pending: '#facc15', expired: '#f87171', cancelled: '#94a3b8', frozen: '#38bdf8' },
  },
}

export default function useChartColors() {
  const { resolvedTheme } = useTheme()
  return PALETTE[resolvedTheme] || PALETTE.light
}