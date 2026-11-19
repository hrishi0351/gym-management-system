import { ChevronDown } from 'lucide-react'

export default function Faq({ items }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((item) => (
        <details key={item.q} className="group rounded-xl border border-line bg-surface p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="mt-3 text-sm text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  )
}