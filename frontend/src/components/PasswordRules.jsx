import { Check, Circle } from 'lucide-react'
import { PASSWORD_RULES } from '../utils/passwordPolicy.js'

export default function PasswordRules({ value = '' }) {
  return (
    <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value)
        return (
          <li key={rule.id} className={`flex items-center gap-1.5 ${met ? 'text-success' : 'text-muted'}`}>
            {met ? <Check size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
            <span>{rule.label}</span>
            <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
          </li>
        )
      })}
    </ul>
  )
}