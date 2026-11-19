import { statusClass, statusLabel } from '../../utils/adminFormat.js'

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  )
}