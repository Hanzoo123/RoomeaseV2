import { useState } from 'react'
import { Building2, Check, Eye, EyeOff, Search } from 'lucide-react'
import { ROLE_META } from '../../config/navigation'
import StreetArt from '../illustrations/StreetArt'
import Logo from '../ui/Logo'

const YEAR = new Date().getFullYear()

const ROLES = [
  { id: 'boarder', label: 'Boarder', icon: Search },
  { id: 'landlord', label: 'Landlord', icon: Building2 },
]

const PANEL_COPY = {
  boarder: {
    heading: 'Find a room that feels like home.',
    body: 'Compare boarding houses across Baybay City by location, budget and room type, then reserve in a few taps.',
    points: ['Verified listings near VSU and Poblacion', 'Save favorites and track reservations', 'Clear monthly rates, no hidden fees'],
  },
  landlord: {
    heading: 'Manage your boarding houses in one place.',
    body: 'List rooms, keep availability up to date and respond to reservation requests from boarders.',
    points: ['Publish listings for admin approval', 'Track available slots per property', 'Approve or decline reservation requests'],
  },
}

// Split-screen frame shared by the sign-in and sign-up pages. Colors follow the selected role.
export default function AuthShell({ role, children }) {
  const copy = PANEL_COPY[role]
  return (
    <div data-theme={role} className="min-h-screen bg-page lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-sidebar to-sidebar-deep p-10 text-white lg:flex xl:p-14">
        <Logo tagline={ROLE_META[role].tagline} />
        <div className="my-10">
          <h1 className="max-w-md text-4xl leading-tight font-bold tracking-tight">{copy.heading}</h1>
          <p className="mt-4 max-w-md text-white/75">{copy.body}</p>
          <div className="mt-8 max-w-lg overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15">
            <StreetArt variant={role === 'boarder' ? 0 : 1} className="block aspect-[16/9] w-full" />
          </div>
          <ul className="mt-8 space-y-3 text-sm">
            {copy.points.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-white/15">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/55">© {YEAR} RoomEase · Baybay City, Leyte</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo tagline={ROLE_META[role].tagline} tone="dark" />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

export function RoleTabs({ role, onChange, label = 'Account type' }) {
  return (
    <div role="tablist" aria-label={label} className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-white p-1">
      {ROLES.map(({ id, label: roleLabel, icon: Icon }) => {
        const selected = role === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              selected ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {roleLabel}
          </button>
        )
      })}
    </div>
  )
}

export function IconField({ id, label, icon: Icon, trailing, error, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-11 w-full rounded-lg border bg-white pr-11 pl-10 text-sm placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15 focus:outline-none ${error ? 'border-red-400' : 'border-line'}`}
          {...inputProps}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function usePasswordToggle() {
  const [visible, setVisible] = useState(false)
  const toggle = (
    <button
      type="button"
      onClick={() => setVisible((value) => !value)}
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="rounded-md p-2 text-muted hover:text-ink"
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )
  return [visible ? 'text' : 'password', toggle]
}
