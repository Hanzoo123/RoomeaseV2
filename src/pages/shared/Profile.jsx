import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { useAuth, validateEmail } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { ROLE_META } from '../../config/navigation'
import { resizeImage } from '../../data/images'
import { validatePhone } from '../../data/validation'
import Avatar from '../../components/ui/Avatar'
import { TextField } from '../../components/ui/form'
import { Notice, PageHeader } from '../../components/ui'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { myListings, myReservations, favorites } = useData()
  const fileRef = useRef(null)
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const toast = useToast()

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors(({ [key]: _cleared, ...rest }) => rest)
    setStatus(null)
  }

  const highlights = {
    landlord: [
      ['Listings', myListings.length],
      ['Rooms available', myListings.reduce((sum, listing) => sum + listing.availableRooms, 0)],
    ],
    boarder: [
      ['Reservations', myReservations.length],
      ['Saved rooms', favorites.length],
    ],
  }[user.role]

  async function handlePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Choose a photo (JPG, PNG or WebP).', 'error')
    if (file.size > 8 * 1024 * 1024) return toast('That photo is over 8 MB. Choose a smaller one.', 'error')
    try {
      const avatar = await resizeImage(file, 256, { square: true, quality: 0.85 })
      const result = updateProfile({ avatar })
      toast(result.ok ? 'Profile photo updated.' : result.error, result.ok ? 'success' : 'error')
    } catch {
      toast('That photo couldn’t be read. Try another one.', 'error')
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name.'
    if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (form.phone && !validatePhone(form.phone)) nextErrors.phone = 'Enter an 11-digit mobile number starting with 09, e.g. 0917 123 4567.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const result = updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() })
    if (result.ok) toast('Profile updated.')
    setStatus(result.ok ? null : { tone: 'error', text: result.error })
  }

  return (
    <div className="content-narrow">
      <PageHeader title="My Profile" subtitle="This is what landlords and boarders see when you contact them." />

      <div className="row g-4">
        <div className="col-md-4">
          <aside className="card">
            <div className="card-body p-4 d-flex flex-column align-items-center text-center">
              <Avatar person={user} className="avatar-lg" />
              <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={handlePhoto} aria-label="Upload a profile photo" />
              <div className="d-flex gap-2 mt-3">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fileRef.current?.click()}>
                  <Camera size={14} aria-hidden="true" />
                  {user.avatar ? 'Change photo' : 'Add photo'}
                </button>
                {user.avatar && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    aria-label="Remove profile photo"
                    onClick={() => {
                      updateProfile({ avatar: null })
                      toast('Profile photo removed.', 'info')
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
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
                hint={
                  { landlord: 'Shown to boarders on your listings.', boarder: 'Shared with landlords when you request a room.' }[user.role]
                }
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
