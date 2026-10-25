import { ChevronDown } from 'lucide-react'

const inputClass =
  'w-full rounded-lg border border-line bg-white px-3.5 text-sm placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15 focus:outline-none disabled:bg-page disabled:text-muted'

function FieldShell({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

export function TextField({ id, label, hint, error, className = '', ...inputProps }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-11 ${inputClass} ${error ? 'border-red-400' : ''} ${className}`}
        {...inputProps}
      />
    </FieldShell>
  )
}

export function TextArea({ id, label, hint, error, ...inputProps }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        className={`min-h-28 py-2.5 ${inputClass} ${error ? 'border-red-400' : ''}`}
        {...inputProps}
      />
    </FieldShell>
  )
}

export function SelectField({ id, label, hint, error, children, ...selectProps }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <select id={id} className={`h-11 appearance-none pr-9 ${inputClass}`} {...selectProps}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
    </FieldShell>
  )
}

export function Toggle({ id, label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}
