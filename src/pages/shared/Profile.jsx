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
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My Profile" subtitle="This is what landlords and boarders see when you contact them." />

      <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="card flex flex-col items-center p-6 text-center md:self-start">
          <span className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-accent to-sidebar text-2xl font-semibold text-white">{initials}</span>
          <p className="mt-4 font-semibold">{user.name}</p>
          <p className="text-sm text-muted">{ROLE_META[user.role].label}</p>
          <dl className="mt-5 grid w-full grid-cols-2 gap-2 border-t border-line pt-5">
            {highlights.map(([label, value]) => (
              <div key={label}>
                <dd className="text-lg font-bold">{value}</dd>
                <dt className="text-xs text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </aside>

        <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-semibold">Personal information</h2>
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
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
