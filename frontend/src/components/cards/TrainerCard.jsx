import SmartImage from '../SmartImage.jsx'
import { initials } from '../../utils/format.js'

export default function TrainerCard({ trainer }) {
  const fullName = `${trainer.firstName} ${trainer.lastName}`

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <SmartImage
        src={trainer.photoUrl}
        alt={fullName}
        className="aspect-[4/3] w-full object-cover"
        fallback={
          <span className="font-display text-6xl font-extrabold">{initials(trainer.firstName, trainer.lastName)}</span>
        }
      />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl font-bold uppercase">{fullName}</h3>
        {trainer.specialization && <p className="text-sm font-semibold text-brand">{trainer.specialization}</p>}
        {trainer.bio && <p className="mt-3 line-clamp-4 text-sm text-muted">{trainer.bio}</p>}
        <dl className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-4 text-xs text-muted">
          <div className="flex gap-1">
            <dt className="font-semibold">Experience:</dt>
            <dd>{trainer.experienceYears} {trainer.experienceYears === 1 ? 'year' : 'years'}</dd>
          </div>
          {trainer.certifications && (
            <div className="flex gap-1">
              <dt className="font-semibold">Certified:</dt>
              <dd>{trainer.certifications}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  )
}