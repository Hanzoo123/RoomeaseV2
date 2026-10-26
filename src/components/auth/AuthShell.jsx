import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Check, Eye, EyeOff, Search } from 'lucide-react'
import { ThemeToggle } from '../ui/feedback'
import { ROLE_META } from '../../config/navigation'
import StreetArt from '../illustrations/StreetArt'
import Logo from '../ui/Logo'

const YEAR = new Date().getFullYear()

const ROLES = {
  boarder: { label: 'Boarder', icon: Search },
  landlord: { label: 'Landlord', icon: Building2 },
}

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
    <div data-theme={role} className="container-fluid">
      <div className="row min-vh-100">
        <aside className="col-lg-6 d-none d-lg-flex flex-column justify-content-between bg-sidebar-gradient text-white p-5">
          <Link to="/" className="text-decoration-none" aria-label="RoomEase home">
            <Logo tagline={ROLE_META[role].tagline} />
          </Link>
          <div className="my-5" style={{ maxWidth: '32rem' }}>
            <h1 className="display-6 fw-bold tracking-tight">{copy.heading}</h1>
            <p className="text-white text-opacity-75 mt-3">{copy.body}</p>
            <div className="ratio ratio-16x9 rounded-4 overflow-hidden shadow-lg border border-white border-opacity-25 mt-4">
              <StreetArt variant={role === 'boarder' ? 0 : 1} />
            </div>
            <ul className="list-unstyled small d-flex flex-column gap-3 mt-4 mb-0">
              {copy.points.map((point) => (
                <li key={point} className="d-flex align-items-center gap-3">
                  <span className="icon-circle bg-white bg-opacity-25" style={{ width: '1.5rem', height: '1.5rem' }}>
                    <Check size={14} aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white text-opacity-50 mb-0">© {YEAR} RoomEase · Baybay City, Leyte</p>
        </aside>

        <main className="col-lg-6 d-flex align-items-center justify-content-center py-5 px-3">
          <div className="w-100" style={{ maxWidth: '28rem' }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <Link to="/" className="text-decoration-none d-lg-none" aria-label="RoomEase home">
                <Logo tagline={ROLE_META[role].tagline} tone="dark" />
              </Link>
              <Link to="/" className="d-none d-lg-inline small fw-medium link-secondary text-decoration-none">
                ← Back to home
              </Link>
              <ThemeToggle />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function RoleTabs({ role, onChange, label = 'Account type' }) {
  return (
    <div className="bg-body border rounded-3 p-1">
      <ul role="tablist" aria-label={label} className="nav nav-pills nav-fill gap-1">
        {Object.keys(ROLES).map((id) => {
          const { label: roleLabel, icon: Icon } = ROLES[id]
          const selected = role === id
          return (
            <li key={id} className="nav-item">
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChange(id)}
                className={`nav-link w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold py-2 ${selected ? 'active' : ''}`}
              >
                <Icon size={16} aria-hidden="true" />
                {roleLabel}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function IconField({ id, label, icon: Icon, trailing, error, 'aria-describedby': describedBy, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="input-icon">
        <Icon size={16} className="lead-icon" aria-hidden="true" />
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={[error && `${id}-error`, describedBy].filter(Boolean).join(' ') || undefined}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          {...inputProps}
        />
        {trailing && <div className="trailing">{trailing}</div>}
      </div>
      {error && (
        <div id={`${id}-error`} className="invalid-feedback d-block">
          {error}
        </div>
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
      className="btn btn-link text-body-secondary p-2"
    >
      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
  return [visible ? 'text' : 'password', toggle]
}
