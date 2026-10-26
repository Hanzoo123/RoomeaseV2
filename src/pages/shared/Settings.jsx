import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, RotateCcw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { passwordIsStrong } from '../../data/validation'
import PasswordChecklist from '../../components/auth/PasswordChecklist'
import { TextField, Toggle } from '../../components/ui/form'
import { Modal, Notice, PageHeader } from '../../components/ui'

function PasswordForm() {
  const { changePassword } = useAuth()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [status, setStatus] = useState(null)
  const toast = useToast()
  const set = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }))

  function handleSubmit(event) {
    event.preventDefault()
    if (!passwordIsStrong(form.next)) return setStatus({ tone: 'error', text: 'Your new password needs everything on the checklist.' })
    if (form.next === form.current) return setStatus({ tone: 'error', text: 'Choose a password you haven’t been using.' })
    if (form.next !== form.confirm) return setStatus({ tone: 'error', text: 'The new passwords don’t match.' })
    const result = changePassword(form.current, form.next)
    if (!result.ok) return setStatus({ tone: 'error', text: result.error })
    setForm({ current: '', next: '', confirm: '' })
    setStatus(null)
    toast('Password changed. Use your new password next time you sign in.')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card">
      <div className="card-body p-4 d-flex flex-column gap-3">
        <h2 className="fs-6 fw-semibold mb-0">Change password</h2>
        <TextField id="current-password" label="Current password" type="password" autoComplete="current-password" value={form.current} onChange={set('current')} />
        <div className="row g-3">
          <div className="col-sm-6">
            <TextField id="new-password" label="New password" type="password" autoComplete="new-password" aria-describedby="new-password-rules" value={form.next} onChange={set('next')} />
          </div>
          <div className="col-sm-6">
            <TextField id="confirm-password" label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          </div>
        </div>
        <PasswordChecklist password={form.next} id="new-password-rules" />
        {status && <Notice tone={status.tone}>{status.text}</Notice>}
        <div className="d-flex justify-content-end">
          <button type="submit" className="btn btn-primary" disabled={!form.current || !form.next}>
            Update password
          </button>
        </div>
      </div>
    </form>
  )
}

// The same two saved preferences, worded for each role.
const TOGGLE_COPY = {
  boarder: {
    reservations: ['Reservation updates', 'Get notified when a landlord approves or declines your request.'],
    tips: ['New listings near you', 'Hear about new boarding houses in your preferred areas.'],
  },
  landlord: {
    reservations: ['New reservation requests', 'Get notified when a boarder requests a room.'],
    tips: ['Listing tips', 'Occasional tips to get more reservations.'],
  },
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { preferences, setPreferences, resetDemoData } = useData()
  const [confirmReset, setConfirmReset] = useState(false)
  const toast = useToast()
  const copy = TOGGLE_COPY[user.role]

  return (
    <div className="content-narrow d-flex flex-column gap-4">
      <PageHeader title="Settings" subtitle="Manage notifications, security and your account." />

      <section className="card">
        <div className="card-body px-4 py-2">
          <h2 className="fs-6 fw-semibold py-2 mb-0">Notifications</h2>
          <div className="border-top">
            <Toggle
              id="pref-reservations"
              label={copy.reservations[0]}
              description={copy.reservations[1]}
              checked={preferences.reservationAlerts}
              onChange={(value) => {
                setPreferences({ reservationAlerts: value })
                toast('Notification settings saved.')
              }}
            />
          </div>
          <div className="border-top">
            <Toggle
              id="pref-email"
              label="Email updates"
              description={`Also send important updates to ${user.email}.`}
              checked={preferences.emailUpdates}
              onChange={(value) => {
                setPreferences({ emailUpdates: value })
                toast('Notification settings saved.')
              }}
            />
          </div>
          <div className="border-top">
            <Toggle
              id="pref-tips"
              label={copy.tips[0]}
              description={copy.tips[1]}
              checked={preferences.listingTips}
              onChange={(value) => {
                setPreferences({ listingTips: value })
                toast('Notification settings saved.')
              }}
            />
          </div>
        </div>
      </section>

      <PasswordForm />

      <section className="card">
        <div className="card-body p-4 d-flex flex-column gap-3 align-items-start">
          <h2 className="fs-6 fw-semibold mb-0">Demo data</h2>
          <p className="small text-body-secondary mb-0">Listings, reservations and notifications are saved in this browser. Reset them to start the demo over (accounts are kept).</p>
          <button type="button" onClick={() => setConfirmReset(true)} className="btn btn-outline-secondary">
            <RotateCcw size={16} aria-hidden="true" />
            Reset demo data
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-body p-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <h2 className="fs-6 fw-semibold mb-1">Sign out</h2>
            <p className="small text-body-secondary mb-0">You’re signed in as {user.email}.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
              toast('You’ve been signed out.', 'info')
              navigate('/login', { replace: true, state: { role: user.role } })
            }}
            className="btn btn-outline-danger"
          >
            <LogOut size={16} aria-hidden="true" />
            Log out
          </button>
        </div>
      </section>

      {confirmReset && (
        <Modal
          title="Reset demo data?"
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <button type="button" onClick={() => setConfirmReset(false)} className="btn btn-outline-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData()
                  setConfirmReset(false)
                  toast('Demo data restored.')
                }}
                className="btn btn-danger"
              >
                Reset
              </button>
            </>
          }
        >
          <p className="small text-body-secondary mb-0">New listings, reservations, favorites and notifications made in this browser will be replaced with the original demo data.</p>
        </Modal>
      )}
    </div>
  )
}
