import { useState } from 'react'
import { useAuth, validateEmail } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { ROLE_META } from '../../config/navigation'
import { TextField } from '../../components/ui/form'
import { Notice, PageHeader } from '../../components/ui'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { myListings, myReservations, favorites } = useData()
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors(({ [key]: _cleared, ...rest }) => rest)
    setStatus(null)
  }

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const highlights =
    user.role === 'landlord'
      ? [
          ['Listings', myListings.length],
          ['Rooms available', myListings.reduce((sum, listing) => sum + listing.availableRooms, 0)],
        ]
      : [
          ['Reservations', myReservations.length],
          ['Saved rooms', favorites.length],
        ]

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name.'
    if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Enter a valid mobile number, e.g. 0917 123 4567.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const result = updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() })
    setStatus(result.ok ? { tone: 'success', text: 'Profile updated.' } : { tone: 'error', text: result.error })
  }

  return (
    <div className="content-narrow">
      <PageHeader title="My Profile" subtitle="This is what landlords and boarders see when you contact them." />

      <div className="row g-4">
        <div className="col-md-4">
          <aside className="card">
            <div className="card-body p-4 d-flex flex-column align-items-center text-center">
              <span className="avatar avatar-lg">{initials}</span>
              <p className="fw-semibold mt-3 mb-0">{user.name}</p>
              <p className="small text-body-secondary mb-0">{ROLE_META[user.role].label}</p>
              <dl className="row w-100 border-top pt-3 mt-3 mb-0">
                {highlights.map(([label, value]) => (
                  <div key={label} className="col-6">
                    <dd className="fs-5 fw-bold mb-0">{value}</dd>
                    <dt className="text-xs fw-normal text-body-secondary">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

        <div className="col-md-8">
          <form onSubmit={handleSubmit} noValidate className="card">
            <div className="card-body p-4 d-flex flex-column gap-3">
              <h2 className="fs-6 fw-semibold mb-0">Personal information</h2>
              <TextField id="profile-name" label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
              <TextField id="profile-email" label="Email address" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
              <TextField
                id="profile-phone"
                label="Mobile number"
                type="tel"
                autoComplete="tel"
                placeholder="0917 123 4567"
                hint={user.role === 'landlord' ? 'Shown to boarders on your listings.' : 'Shared with landlords when they approve your reservation.'}
                value={form.phone}
                onChange={set('phone')}
                error={errors.phone}
              />
              {status && <Notice tone={status.tone}>{status.text}</Notice>}
              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary">
                  Save changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
