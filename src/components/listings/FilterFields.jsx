import { ChevronDown } from 'lucide-react'

export const digitsOnly = (value) => value.replace(/\D/g, '').slice(0, 6)
export const withCommas = (digits) => (digits ? Number(digits).toLocaleString('en-PH') : '')

export function SelectBox({ label, showLabel = true, icon: Icon, value, onChange, children }) {
  return (
    <label className="filter-box">
      {Icon && <Icon size={16} className="flex-shrink-0 text-body-secondary" aria-hidden="true" />}
      <span className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        {showLabel && <span className="filter-label">{label}</span>}
        <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
          {children}
        </select>
      </span>
      <ChevronDown size={16} className="filter-chevron" aria-hidden="true" />
    </label>
  )
}

export function RentBox({ label, value, onChange }) {
  return (
    <label className="filter-box flex-column align-items-stretch justify-content-center gap-0">
      <span className="filter-label">{label}</span>
      <span className="d-flex align-items-center small fw-semibold">
        ₱
        <input
          inputMode="numeric"
          value={withCommas(value)}
          onChange={(event) => onChange(digitsOnly(event.target.value))}
          placeholder="Any"
          className="ps-1"
        />
      </span>
    </label>
  )
}
