import { Monitor, Moon, Sun } from 'lucide-react'
import useTheme from '../hooks/useTheme.js'

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
]

export default function ThemeToggle({ compact = false }) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  if (compact) {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={`Switch to ${next} mode`}
        title={`Switch to ${next} mode`}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-fg transition-colors hover:bg-surface-2"
      >
        {resolvedTheme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </button>
    )
  }

  return (
    <div role="group" aria-label="Color theme" className="inline-flex rounded-xl border border-line bg-surface p-1">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            theme === value ? 'bg-brand text-on-brand' : 'text-muted hover:text-fg'
          }`}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}