import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { passwordIsStrong, validateEmail } from '../data/validation'
import AuthShell, { IconField, usePasswordToggle } from '../components/auth/AuthShell'
import PasswordChecklist from '../components/auth/PasswordChecklist'
import { Notice } from '../components/ui'

const STEPS = ['Your email', 'Enter the code', 'New password']

// Same flow as the PHP site: email → 6-digit code (valid 10 minutes) → new password.
// The demo has no email service, so the code is shown on screen instead.
export default function ForgotPassword() {
  const { user, requestPasswordReset, verifyResetCode, completePasswordReset } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const role = ['boarder', 'landlord'].includes(location.state?.role) ? location.state.role : 'boarder'
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [demoCode, setDemoCode] = useState(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordType, passwordToggle] = usePasswordToggle()
  const [error, setError] = useState('')

  if (user) return <Navigate to={`/${user.role}`} replace />

  function sendCode(event) {
    event?.preventDefault()
    if (!validateEmail(email)) return setError('Enter the email address on your account.')
    const result = requestPasswordReset(email)
    setDemoCode(result.code)
    setCode('')
    setError('')
    setStep(1)
  }

  function checkCode(event) {
    event.preventDefault()
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code.')
    const result = verifyResetCode(email, code)
    if (!result.ok) return setError(result.error)
    setError('')
    setStep(2)
  }

  function savePassword(event) {
    event.preventDefault()
    if (!passwordIsStrong(password)) return setError('Your new password needs everything on the list.')
    if (password !== confirm) return setError('The passwords don’t match.')
    const result = completePasswordReset(email, password)
    if (!result.ok) {
      setStep(0)
      return setError(result.error)
    }
    toast('Password changed. Sign in with your new password.')
    navigate('/login', { replace: true, state: { role, email } })
  }

  return (
    <AuthShell role={role}>
      <Link to="/login" state={{ role }} className="d-inline-flex align-items-center gap-1 small fw-medium link-secondary text-decoration-none mb-3">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to sign in
      </Link>
      <h2 className="h3 fw-bold tracking-tight mb-1">Reset your password</h2>
      <p className="small text-body-secondary mb-4">We’ll send a code to the email on your account.</p>

      <ol className="reset-steps list-unstyled d-flex gap-2 mb-4" aria-label="Steps">
        {STEPS.map((label, index) => (
          <li key={label} className={`flex-fill ${index <= step ? 'done' : ''}`} aria-current={index === step ? 'step' : undefined}>
            <span className="text-2xs fw-semibold text-uppercase">Step {index + 1}</span>
            <span className="d-block small">{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form onSubmit={sendCode} noValidate className="d-flex flex-column gap-3">
          <IconField
            id="reset-email"
            label="Email address"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error && <Notice tone="error">{error}</Notice>}
          <button type="submit" className="btn btn-primary w-100" style={{ height: '2.75rem' }}>
            Send code
          </button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={checkCode} noValidate className="d-flex flex-column gap-3">
          <p className="small mb-0">
            If an account uses <strong>{email}</strong>, a 6-digit code is on its way. It works for 10 minutes.
          </p>
          <div className="dashed-box bg-body rounded-3 p-3 small">
            <p className="text-xs fw-semibold text-uppercase text-body-secondary mb-1" style={{ letterSpacing: '0.05em' }}>
              Demo inbox
            </p>
            {demoCode ? (
              <p className="mb-0">
                This demo can’t send email, so here is the code: <strong className="fs-5 font-monospace ms-1">{demoCode}</strong>
              </p>
            ) : (
              <p className="mb-0 text-body-secondary">No code was created: in this demo, that means no active account uses this email. Check the address and try again.</p>
            )}
          </div>
          <IconField
            id="reset-code"
            label="6-digit code"
            icon={KeyRound}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          {error && <Notice tone="error">{error}</Notice>}
          <button type="submit" className="btn btn-primary w-100" style={{ height: '2.75rem' }}>
            Check code
          </button>
          <div className="d-flex justify-content-between small">
            <button type="button" className="btn btn-link p-0 small text-decoration-none" onClick={() => {
                setStep(0)
                setError('')
              }}>
              Use another email
            </button>
            <button type="button" className="btn btn-link p-0 small text-decoration-none" onClick={() => sendCode()}>
              Send a new code
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={savePassword} noValidate className="d-flex flex-column gap-3">
          <IconField
            id="reset-password"
            label="New password"
            icon={Lock}
            type={passwordType}
            autoComplete="new-password"
            aria-describedby="reset-password-rules"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            trailing={passwordToggle}
          />
          <PasswordChecklist password={password} id="reset-password-rules" />
          <IconField id="reset-confirm" label="Confirm new password" icon={Lock} type={passwordType} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          {error && <Notice tone="error">{error}</Notice>}
          <button type="submit" className="btn btn-primary w-100" style={{ height: '2.75rem' }}>
            Save new password
          </button>
        </form>
      )}
    </AuthShell>
  )
}
