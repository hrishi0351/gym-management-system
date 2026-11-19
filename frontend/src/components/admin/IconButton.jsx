import { Link } from 'react-router-dom'

const BASE =
  'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50'

/** Icon-only button (or link when `to` is given). `label` is required for accessibility. */
export default function IconButton({ icon: Icon, label, to, onClick, danger = false, disabled = false }) {
  const classes = `${BASE} ${danger ? 'hover:text-danger' : 'hover:text-fg'}`
  const icon = <Icon size={17} aria-hidden="true" />

  if (to) {
    return (
      <Link to={to} aria-label={label} title={label} className={classes}>
        {icon}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={classes}>
      {icon}
    </button>
  )
}