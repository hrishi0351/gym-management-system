import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 18, label = 'Loading' }) {
  return (
    <span role="status" className="inline-flex">
      <Loader2 size={size} className="animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}