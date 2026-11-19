import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { buttonClasses } from '../ui/buttonStyles.js'
import { formatCurrency, formatDuration, perMonth } from '../../utils/format.js'

export default function PlanCard({ plan }) {
  const monthly = perMonth(plan.price, plan.durationDays)

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-surface p-6 shadow-sm ${
        plan.isPopular ? 'border-brand ring-2 ring-brand/30' : 'border-line'
      }`}
    >
      {plan.isPopular && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-brand">
          Most popular
        </span>
      )}
      <h3 className="font-display text-3xl font-extrabold uppercase">{plan.name}</h3>
      {plan.description && <p className="mt-1 text-sm text-muted">{plan.description}</p>}

      <p className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-5xl font-extrabold text-brand">{formatCurrency(plan.price)}</span>
        <span className="text-sm text-muted">/ {formatDuration(plan.durationDays)}</span>
      </p>
      <p className="mt-1 h-5 text-xs text-muted">{monthly ? `About ${formatCurrency(monthly)} per month` : ''}</p>

      <ul className="mt-5 flex-1 space-y-2.5 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        to={`/membership-registration?plan=${plan.id}`}
        className={buttonClasses({ variant: plan.isPopular ? 'primary' : 'secondary', className: 'mt-6 w-full' })}
      >
        Choose {plan.name}
      </Link>
    </article>
  )
}