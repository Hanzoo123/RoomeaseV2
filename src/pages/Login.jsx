import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CircleAlert, Lock, Mail } from 'lucide-react'
import { ROLE_META } from '../config/navigation'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { DEMO_USERS } from '../data/mockData'
import { pathAfterSignIn } from '../context/SitePaths'
import AuthShell, { IconField, RoleTabs, usePasswordToggle } from '../components/auth/AuthShell'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState(location.state?.role ?? 'boarder')
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [passwordType, passwordToggle] = usePasswordToggle()
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const toast = useToast()

  // Also covers the render right after signing in, so it must agree with handleSubmit.
  if (user) return <Navigate to={pathAfterSignIn(location.state?.from, user.role)} replace />

  function fillDemo(account) {
    setRole(account.role)
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    const result = login({ email, password, role, remember })
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast(`Welcome back, ${result.firstName}!`)
    navigate(pathAfterSignIn(location.state?.from, role), { replace: true })
  }

  return (
    <AuthShell role={role}>
      <h2 className="h3 fw-bold tracking-tight mb-1">Welcome back</h2>
      <p className="small text-body-secondary mb-4">Sign in to your RoomEase account.</p>

      <RoleTabs
        roles={['boarder', 'landlord', 'admin']}
        role={role}
        onChange={(nextRole) => {
          setRole(nextRole)
          setError('')
        }}
      />

      <form onSubmit={handleSubmit} noValidate className="d-flex flex-column gap-3 mt-4">
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

        <div className="d-flex align-items-center justify-content-between small">
          <div className="form-check mb-0">
            <input id="remember" type="checkbox" className="form-check-input" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            <label htmlFor="remember" className="form-check-label">
              Remember me
            </label>
          </div>
          <Link to="/forgot-password" state={{ role, email: email.trim() }} className="small fw-medium text-decoration-none">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div role="alert" className="alert alert-danger d-flex align-items-start gap-2 small py-2 px-3 mb-0">
            <CircleAlert size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary w-100" style={{ height: '2.75rem' }}>
          Sign in as {ROLE_META[role].label}
        </button>
      </form>

      <p className="small text-body-secondary text-center mt-4 mb-0">
        New to RoomEase?{' '}
        <Link to="/signup" state={{ role: role === 'admin' ? 'boarder' : role, from: location.state?.from }} className="fw-semibold text-decoration-none">
          Create an account
        </Link>
      </p>

      <div className="dashed-box bg-body rounded-3 p-3 mt-4">
        <p className="text-xs fw-semibold text-uppercase text-body-secondary mb-3" style={{ letterSpacing: '0.05em' }}>
          Demo accounts
        </p>
        <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
          {DEMO_USERS.filter((account) => account.demo).map((account) => (
            <li key={account.id} className="d-flex align-items-center justify-content-between gap-3 small">
              <div style={{ minWidth: 0 }}>
                <p className="fw-medium mb-0">
                  {account.name} <span className="text-body-secondary">· {ROLE_META[account.role].label}</span>
                </p>
                <p className="text-xs text-body-secondary text-truncate mb-0">
                  {account.email} / {account.password}
                </p>
              </div>
              <button type="button" onClick={() => fillDemo(account)} className="btn btn-sm btn-outline-secondary flex-shrink-0">
                Use
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthShell>
  )
}
