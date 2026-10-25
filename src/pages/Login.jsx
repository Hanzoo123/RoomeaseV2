import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Building2, Check, CircleAlert, Eye, EyeOff, Lock, Mail, Search } from 'lucide-react'
import { ROLE_META } from '../config/navigation'
import { useAuth } from '../context/AuthContext'
import { DEMO_USERS } from '../data/mockData'
import StreetArt from '../components/illustrations/StreetArt'
import Logo from '../components/ui/Logo'

const ROLES = [
  { id: 'boarder', label: 'Boarder', icon: Search },
  { id: 'landlord', label: 'Landlord', icon: Building2 },
]

const YEAR = new Date().getFullYear()

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

function Field({ id, label, icon: Icon, trailing, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={id}
          className="h-11 w-full rounded-lg border border-line bg-white pr-11 pl-10 text-sm placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15 focus:outline-none"
          {...inputProps}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
    </div>
  )
}

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState(location.state?.role ?? 'boarder')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (user) return <Navigate to={`/${user.role}`} replace />

  const copy = PANEL_COPY[role]
  const roleLabel = ROLE_META[role].label

  function selectRole(nextRole) {
    setRole(nextRole)
    setError('')
  }

  function fillDemo(account) {
    setRole(account.role)
    setEmail(account.email)
    setPassword(account.password)
    setError('')
    setNotice('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setNotice('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    const result = login({ email, password, role, remember })
    if (!result.ok) {
      setError(result.error)
      return
    }
    const from = location.state?.from
    navigate(from?.startsWith(`/${role}`) ? from : `/${role}`, { replace: true })
  }

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

          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in to your RoomEase account.</p>

          <div role="tablist" aria-label="Account type" className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-white p-1">
            {ROLES.map(({ id, label, icon: Icon }) => {
              const selected = role === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectRole(id)}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    selected ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Field
              id="email"
              label="Email address"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Field
              id="password"
              label="Password"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="rounded-md p-2 text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="size-4 accent-accent"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setNotice('Password reset isn’t available in the demo yet. Use one of the demo accounts below.')}
                className="font-medium text-accent hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
            {notice && <p className="rounded-lg bg-accent-soft px-3 py-2.5 text-sm">{notice}</p>}

            <button type="submit" className="btn-primary h-11 w-full">
              Sign in as {roleLabel}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-dashed border-line bg-white p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Demo accounts</p>
            <ul className="mt-3 space-y-3">
              {DEMO_USERS.map((account) => (
                <li key={account.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {account.name} <span className="text-muted">· {ROLE_META[account.role].label}</span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {account.email} / {account.password}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemo(account)}
                    className="shrink-0 rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
                  >
                    Use
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
