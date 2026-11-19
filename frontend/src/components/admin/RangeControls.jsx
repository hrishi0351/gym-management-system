import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import { PRESETS } from '../../hooks/useDateRange.js'
import { formatDate } from '../../utils/adminFormat.js'

/** `range` is the object returned by useDateRange(). Extra controls can be passed as children. */
export default function RangeControls({ range, children }) {
  const { preset, from, to, today, error, choosePreset, setFrom, setTo } = range

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <Select label="Period" value={preset} onChange={(event) => choosePreset(event.target.value)} className="w-48">
        {PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </Select>

      {preset === 'custom' ? (
        <>
          <Input
            label="From"
            type="date"
            value={from}
            min="2000-01-01"
            max={to || today}
            onChange={(event) => setFrom(event.target.value)}
            className="w-44"
          />
          <Input
            label="To"
            type="date"
            value={to}
            min={from || '2000-01-01'}
            max={today}
            onChange={(event) => setTo(event.target.value)}
            className="w-44"
          />
        </>
      ) : (
        <p className="pb-3 text-sm text-muted">
          {formatDate(from)} – {formatDate(to)}
        </p>
      )}

      {children}

      {error && (
        <p role="alert" className="pb-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}