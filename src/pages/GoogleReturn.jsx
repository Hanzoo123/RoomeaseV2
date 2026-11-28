import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LoaderCircle, Phone } from 'lucide-react'
import { ROLE_META } from '../config/navigation'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { pathAfterSignIn } from '../context/SitePaths'
import AuthShell, { IconField, RoleTabs } from '../components/auth/AuthShell'
import { Notice } from '../components/ui'

// Where "Continue with Google" ends (the API sends the browser here from Google):
// ?status=signed-in|linked  signed in already: load the session and go on;
// ?status=choose-role       someone new: Boarder or Landlord, and a phone number, first.
const safeNext = (path) => (path && path.startsWith('/') && !path.startsWith('//') ? path : null)

function Finishing() {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 text-body-secondary py-5" aria-busy="true">
      <LoaderCircle size={20} className="spin" aria-hidden="true" />
      Signing you in…
    </div>
  )
}

function SignedIn({ linked, next }) {
  const { refreshSession } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    refreshSession().then((result) => {
      if (!result.ok || !result.user) {
        navigate('/login?googleError=failed', { replace: true })
        return
      }
      toast(`Welcome back, ${result.user.firstName}!`)
      if (linked) toast('Your account now signs in with Google, so your old password no longer works. To set a new one, use “Forgot password”.', 'info')
      navigate(pathAfterSignIn(next, result.user.role), { replace: true })
    })
  }, [refreshSession, navigate, toast, linked, next])

  return <Finishing />
}

function OneMoreStep({ initialRole, next }) {
  const { user, googlePending, finishGoogleSignup } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [pending, setPending] = useState(null)
  const [expired, setExpired] = useState('')
  const [role, setRole] = useState(initialRole === 'landlord' ? 'landlord' : 'boarder')
  const [phone, setPhone] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let current = true
    googlePending().then((result) => {
      if (!current) return
      if (result.ok) setPending(result)
      else setExpired(result.error)
    })
    return () => {
      current = false
    }
  }, [googlePending])

  if (user && !busy) return <Navigate to={pathAfterSignIn(next, user.role)} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (!agreed) return setError('Please agree to the Terms & Conditions to continue.')
    setBusy(true)
    const result = await finishGoogleSignup({ role, phone })
    if (!result.ok) {
      setBusy(false)
      setErrors(result.fields ?? {})
      setError(result.fields ? '' : result.error)
      return
    }
    toast('Account created. Welcome to RoomEase!')
    navigate(pathAfterSignIn(safeNext(result.next) ?? next, role), { replace: true })
  }

  return (
    <AuthShell role={role}>
      <h2 className="h3 fw-bold tracking-tight mb-1">One more step</h2>
      {expired ? (
        <>
          <p className="small text-body-secondary mb-4">{expired}</p>
          <Link to="/login" className="btn btn-primary w-100">
            Back to sign in
          </Link>
        </>
      ) : !pending ? (
        <Finishing />
      ) : (
        <>
          <p className="small text-body-secondary mb-4">
            You’re signing up with Google as <strong className="text-body">{pending.name}</strong> ({pending.email}).
          </p>
          <RoleTabs role={role} onChange={setRole} label="I am a" />
          <p className="text-xs text-body-secondary mt-2 mb-0">{role === 'boarder' ? 'Looking for a room to rent.' : 'Renting out rooms in a boarding house.'}</p>
          <form onSubmit={handleSubmit} noValidate className="d-flex flex-column gap-3 mt-3">
            <IconField
              id="phone"
              label="Mobile number"
              icon={Phone}
              type="tel"
              autoComplete="tel"
              placeholder="0917 123 4567"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
                setErrors({})
              }}
              error={errors.phone}
            />
            <div className="form-check small mb-0">
              <input id="agree" type="checkbox" className="form-check-input" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
              <label htmlFor="agree" className="form-check-label">
                I agree to the RoomEase{' '}
                <Link to="/terms" target="_blank" rel="noopener">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" rel="noopener">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            <button type="submit" className="btn btn-primary w-100" style={{ height: '2.75rem' }} disabled={busy}>
              {busy && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
              Create {ROLE_META[role].label} account
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}

export default function GoogleReturn() {
  const [params] = useSearchParams()
  const status = params.get('status')
  const next = safeNext(params.get('next'))
  if (status === 'signed-in' || status === 'linked') return <SignedIn linked={status === 'linked'} next={next} />
  if (status === 'choose-role') return <OneMoreStep initialRole={params.get('role')} next={next} />
  return <Navigate to="/login" replace />
}
