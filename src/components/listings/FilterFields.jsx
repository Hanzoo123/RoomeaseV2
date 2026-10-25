import { ChevronDown } from 'lucide-react'

export const digitsOnly = (value) => value.replace(/\D/g, '').slice(0, 6)
export const withCommas = (digits) => (digits ? Number(digits).toLocaleString('en-PH') : '')

export function SelectBox({ label, showLabel = true, icon: Icon, value, onChange, children }) {
  return (
    <label className="relative flex h-14 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
      {Icon && <Icon className="size-4 shrink-0 text-muted" aria-hidden="true" />}
      <span className="flex min-w-0 flex-1 flex-col">
        {showLabel && <span className="text-[11px] text-muted">{label}</span>}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="w-full appearance-none bg-transparent pr-6 text-sm font-medium outline-none"
        >
          {children}
        </select>
      </span>
      <ChevronDown className="pointer-events-none absolute right-3.5 size-4 text-muted" aria-hidden="true" />
    </label>
  )
}

export function RentBox({ label, value, onChange }) {
  return (
    <label className="flex h-14 flex-col justify-center rounded-xl border border-line bg-white px-3.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="flex items-center text-sm font-semibold">
        ₱
        <input
          inputMode="numeric"
          value={withCommas(value)}
          onChange={(event) => onChange(digitsOnly(event.target.value))}
          placeholder="Any"
          className="w-full bg-transparent pl-0.5 outline-none placeholder:font-normal placeholder:text-muted/70"
        />
      </span>
    </label>
  )
}
