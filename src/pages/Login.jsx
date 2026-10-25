import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CircleAlert, Lock, Mail } from 'lucide-react'
import { ROLE_META } from '../config/navigation'
import { useAuth } from '../context/AuthContext'
import { DEMO_USERS } from '../data/mockData'
import AuthShell, { IconField, RoleTabs, usePasswordToggle } from '../components/auth/AuthShell'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState(location.state?.role ?? 'boarder')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordType, passwordToggle] = usePasswordToggle()
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (user) return <Navigate to={`/${user.role}`} replace />

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
    <AuthShell role={role}>
      <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
      <p className="mt-1 text-sm text-muted">Sign in to your RoomEase account.</p>

      <div className="mt-6">
        <RoleTabs
          role={role}
          onChange={(nextRole) => {
            setRole(nextRole)
            setError('')
          }}
        />
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <IconField
          id="email"
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <IconField
          id="password"
          label="Password"
          icon={Lock}
          type={passwordType}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          trailing={passwordToggle}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 accent-accent" />
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
          Sign in as {ROLE_META[role].label}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to RoomEase?{' '}
        <Link to="/signup" state={{ role }} className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-line bg-white p-4">
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
    </AuthShell>
  )
}
