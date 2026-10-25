import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, RotateCcw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { TextField, Toggle } from '../../components/ui/form'
import { Modal, Notice, PageHeader } from '../../components/ui'

function PasswordForm() {
  const { changePassword } = useAuth()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [status, setStatus] = useState(null)
  const set = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }))

  function handleSubmit(event) {
    event.preventDefault()
    if (form.next.length < 8) return setStatus({ tone: 'error', text: 'Use at least 8 characters for your new password.' })
    if (form.next !== form.confirm) return setStatus({ tone: 'error', text: 'The new passwords don’t match.' })
    const result = changePassword(form.current, form.next)
    if (!result.ok) return setStatus({ tone: 'error', text: result.error })
    setForm({ current: '', next: '', confirm: '' })
    setStatus({ tone: 'success', text: 'Password changed. Use your new password next time you sign in.' })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-5 sm:p-6">
      <h2 className="font-semibold">Change password</h2>
      <TextField id="current-password" label="Current password" type="password" autoComplete="current-password" value={form.current} onChange={set('current')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="new-password" label="New password" type="password" autoComplete="new-password" hint="At least 8 characters." value={form.next} onChange={set('next')} />
        <TextField id="confirm-password" label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
      </div>
      {status && <Notice tone={status.tone}>{status.text}</Notice>}
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={!form.current || !form.next}>
          Update password
        </button>
      </div>
    </form>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { preferences, setPreferences, resetDemoData } = useData()
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const isLandlord = user.role === 'landlord'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" subtitle="Manage notifications, security and your account." />

      <section className="card divide-y divide-line px-5 sm:px-6">
        <h2 className="py-4 font-semibold">Notifications</h2>
        <Toggle
          id="pref-reservations"
          label={isLandlord ? 'New reservation requests' : 'Reservation updates'}
          description={isLandlord ? 'Get notified when a boarder requests a room.' : 'Get notified when a landlord approves or declines your request.'}
          checked={preferences.reservationAlerts}
          onChange={(value) => setPreferences({ reservationAlerts: value })}
        />
        <Toggle
          id="pref-email"
          label="Email updates"
          description={`Also send important updates to ${user.email}.`}
          checked={preferences.emailUpdates}
          onChange={(value) => setPreferences({ emailUpdates: value })}
        />
        <Toggle
          id="pref-tips"
          label={isLandlord ? 'Listing tips' : 'New listings near you'}
          description={isLandlord ? 'Occasional tips to get more reservations.' : 'Hear about new boarding houses in your preferred areas.'}
          checked={preferences.listingTips}
          onChange={(value) => setPreferences({ listingTips: value })}
        />
      </section>

      <PasswordForm />

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">Demo data</h2>
        <p className="text-sm text-muted">
          Listings, reservations and notifications are saved in this browser. Reset them to start the demo over (accounts are kept).
        </p>
        {resetDone && <Notice>Demo data restored.</Notice>}
        <button type="button" onClick={() => setConfirmReset(true)} className="btn border border-line hover:bg-page">
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset demo data
        </button>
      </section>

      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-semibold">Sign out</h2>
          <p className="text-sm text-muted">You’re signed in as {user.email}.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login', { replace: true, state: { role: user.role } })
          }}
          className="btn border border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </button>
      </section>

      {confirmReset && (
        <Modal
          title="Reset demo data?"
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <button type="button" onClick={() => setConfirmReset(false)} className="btn border border-line hover:bg-page">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData()
                  setConfirmReset(false)
                  setResetDone(true)
                }}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Reset
              </button>
            </>
          }
        >
          <p className="text-sm text-muted">New listings, reservations, favorites and notifications made in this browser will be replaced with the original demo data.</p>
        </Modal>
      )}
    </div>
  )
}
