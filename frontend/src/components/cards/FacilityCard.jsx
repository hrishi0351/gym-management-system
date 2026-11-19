import DynamicIcon from '../DynamicIcon.jsx'

export default function FacilityCard({ facility }) {
  return (
    <article className="h-full rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <DynamicIcon name={facility.icon} size={24} />
      </span>
      <h3 className="mt-4 font-display text-2xl font-bold uppercase">{facility.name}</h3>
      {facility.description && <p className="mt-2 text-sm text-muted">{facility.description}</p>}
    </article>
  )
}