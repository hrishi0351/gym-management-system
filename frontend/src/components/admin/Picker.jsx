import { useState } from 'react'
import SearchInput from './SearchInput.jsx'
import Spinner from '../ui/Spinner.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import { getErrorMessage } from '../../utils/errors.js'

/** fetcher must be a stable function returning { data, meta } (see adminService). */
export default function Picker({
  fetcher,
  extraParams,
  filter,
  renderItem,
  onSelect,
  placeholder,
  label,
  emptyText = 'No results found.',
}) {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const list = useList(fetcher, { ...extraParams, search: debounced.trim(), page: 1, limit: 8 })
  const items = (list.data || []).filter(filter || (() => true))

  let body
  if (list.error) {
    body = (
      <p role="alert" className="py-8 text-center text-sm text-danger">
        {getErrorMessage(list.error)}
      </p>
    )
  } else if (!list.data) {
    body = (
      <div className="flex justify-center py-8 text-brand">
        <Spinner size={24} label="Searching" />
      </div>
    )
  } else if (items.length === 0) {
    body = <p className="py-8 text-center text-sm text-muted">{emptyText}</p>
  } else {
    body = (
      <ul className={`divide-y divide-line overflow-hidden rounded-xl border border-line ${list.loading ? 'opacity-60' : ''}`}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-surface-2"
            >
              {renderItem(item)}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div>
      <div className="flex">
        <SearchInput value={search} onChange={setSearch} placeholder={placeholder} label={label} />
      </div>
      <div className="mt-3" aria-live="polite">
        {body}
      </div>
    </div>
  )
}