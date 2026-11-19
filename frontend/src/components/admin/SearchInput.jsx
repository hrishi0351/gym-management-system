import { Search } from 'lucide-react'
import { inputClasses } from '../ui/inputStyles.js'

export default function SearchInput({ value, onChange, placeholder = 'Search…', label = 'Search' }) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        maxLength={100}
        className={`${inputClasses(false)} pl-10`}
      />
    </div>
  )
}