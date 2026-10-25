import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, Phone, User } from 'lucide-react'
import { ROLE_META } from '../config/navigation'
import { useAuth, validateEmail } from '../context/AuthContext'
import AuthShell, { IconField, RoleTabs, usePasswordToggle } from '../components/auth/AuthShell'
import { Notice } from '../components/ui'

const EMPTY = { name: '', email: '', phone: '', password: '', confirm: '' }

function validate(form) {
  const errors = {}
  if (form.name.trim().split(/\s+/).length < 2) errors.name = 'Enter your first and last name.'
  if (!validateEmail(form.email)) errors.email = 'Enter a valid email address.'
  if (form.phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter a valid mobile number, e.g. 0917 123 4567.'
  if (form.password.length < 8) errors.password = 'Use at least 8 characters.'
  if (form.confirm !== form.password) errors.confirm = 'Passwords don’t match.'
  return errors
}

export default function Signup() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState(location.state?.role ?? 'boarder')
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [passwordType, passwordToggle] = usePasswordToggle()

  if (user) return <Navigate to={`/${user.role}`} replace />

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors(({ [key]: _cleared, ...rest }) => rest)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return setError('')
    if (!agreed) return setError('Please agree to the Terms & Conditions to continue.')

    const result = register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role })
    if (!result.ok) return setError(result.error)
    navigate(`/${role}`, { replace: true })
  }

  return (
    <AuthShell role={role}>
      <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
      <p className="mt-1 text-sm text-muted">It takes less than a minute.</p>

      <div className="mt-6">
        <RoleTabs role={role} onChange={setRole} label="I am a" />
        <p className="mt-2 text-xs text-muted">
          {role === 'boarder' ? 'Looking for a room to rent.' : 'Renting out rooms in a boarding house.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <IconField id="name" label="Full name" icon={User} autoComplete="name" placeholder="Juan Dela Cruz" value={form.name} onChange={set('name')} error={errors.name} />
        <IconField id="email" label="Email address" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} />
        <IconField id="phone" label="Mobile number" icon={Phone} type="tel" autoComplete="tel" placeholder="0917 123 4567" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <div className="grid gap-4 sm:grid-cols-2">
          <IconField
            id="password"
            label="Password"
            icon={Lock}
            type={passwordType}
            autoComplete="new-password"
            placeholder="8+ characters"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            trailing={passwordToggle}
          />
          <IconField id="confirm" label="Confirm password" icon={Lock} type={passwordType} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-0.5 size-4 accent-accent" />
          <span>I agree to the RoomEase Terms & Conditions and Privacy Policy.</span>
        </label>

        {error && <Notice tone="error">{error}</Notice>}

        <button type="submit" className="btn-primary h-11 w-full">
          Create {ROLE_META[role].label} account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" state={{ role }} className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
