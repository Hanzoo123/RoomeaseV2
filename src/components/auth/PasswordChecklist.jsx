import { Check, X } from 'lucide-react'
import { PASSWORD_RULES } from '../../data/validation'

// Live list of the password rules (same as the PHP site), ticked off while typing.
export default function PasswordChecklist({ password, id }) {
  if (!password) return null
  return (
    <ul id={id} className="password-checklist list-unstyled row row-cols-2 g-1 text-xs mb-0" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password)
        return (
          <li key={rule.label} className={`col d-flex align-items-center gap-1 ${ok ? 'text-success' : 'text-body-secondary'}`}>
            {ok ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
            <span>
              {rule.label}
              <span className="visually-hidden">{ok ? ' (done)' : ' (missing)'}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
