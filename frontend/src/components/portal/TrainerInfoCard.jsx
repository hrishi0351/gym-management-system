import { formatDate, fullName } from '../../utils/adminFormat.js'
import { initials } from '../../utils/format.js'

export default function TrainerInfoCard({ trainer }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <h2 className="font-display text-2xl font-bold uppercase">Your trainer</h2>
      {trainer ? (
        <div className="mt-4 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft font-display text-2xl font-extrabold text-brand">
            {initials(trainer.firstName, trainer.lastName)}
          </span>
          <div>
            <p className="font-semibold">{fullName(trainer)}</p>
            {trainer.specialization && <p className="text-sm text-brand">{trainer.specialization}</p>}
            <p className="text-xs text-muted">Your trainer since {formatDate(trainer.assignedOn)}</p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No trainer is assigned to you yet. Ask the front desk if you would like one.</p>
      )}
    </section>
  )
}