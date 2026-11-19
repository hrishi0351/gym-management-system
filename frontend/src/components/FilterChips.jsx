export default function FilterChips({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="mb-8 flex flex-wrap justify-center gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            value === option
              ? 'border-brand bg-brand text-on-brand'
              : 'border-line bg-surface text-muted hover:text-fg'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}