import { useCallback, useEffect, useMemo, useState } from 'react'
import ThemeContext from './themeContext.js'

const STORAGE_KEY = 'theme'
const MODES = ['light', 'dark', 'system']
const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)')

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return MODES.includes(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStored)
  const [systemDark, setSystemDark] = useState(() => prefersDark().matches)

  // Follow the operating system setting live
  useEffect(() => {
    const media = prefersDark()
    const onChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const setTheme = useCallback((next) => {
    if (!MODES.includes(next)) return
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage blocked: the choice just won't persist */
    }
  }, [])

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}