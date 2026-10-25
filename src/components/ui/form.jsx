function FieldShell({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children}
      {error ? (
        <div id={`${id}-error`} className="invalid-feedback d-block">
          {error}
        </div>
      ) : (
        hint && <div className="form-text">{hint}</div>
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
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
        style={{ height: '2.75rem' }}
        {...inputProps}
      />
    </FieldShell>
  )
}

export function TextArea({ id, label, hint, error, ...inputProps }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea id={id} aria-invalid={Boolean(error)} className={`form-control ${error ? 'is-invalid' : ''}`} rows={4} {...inputProps} />
    </FieldShell>
  )
}

export function SelectField({ id, label, hint, error, children, ...selectProps }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select id={id} className="form-select" style={{ height: '2.75rem' }} {...selectProps}>
        {children}
      </select>
    </FieldShell>
  )
}

export function Toggle({ id, label, description, checked, onChange }) {
  return (
    <div className="d-flex align-items-start justify-content-between gap-3 py-3">
      <div>
        <label htmlFor={id} className="small fw-medium">
          {label}
        </label>
        {description && <p className="small text-body-secondary mb-0">{description}</p>}
      </div>
      <div className="form-check form-switch mb-0">
        <input
          id={id}
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          style={{ width: '2.75rem', height: '1.4rem' }}
        />
      </div>
    </div>
  )
}
