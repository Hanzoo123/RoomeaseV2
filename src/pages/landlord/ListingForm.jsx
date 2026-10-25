import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, SearchX, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { AMENITIES, AREAS, ROOM_TYPES } from '../../data/mockData'
import { FEATURE_ICONS } from '../../components/listings/RoomCard'
import { SelectField, TextArea, TextField } from '../../components/ui/form'
import { EmptyState, Notice, PageHeader } from '../../components/ui'

const EMPTY = {
  name: '',
  area: AREAS[0],
  address: '',
  price: '',
  roomType: ROOM_TYPES[0],
  totalRooms: '',
  availableRooms: '',
  availableSlots: '',
  amenities: ['Wi-Fi'],
  description: '',
  photo: null,
}

// Shrinks an uploaded photo so it fits comfortably in localStorage.
function resizeImage(file, maxSize = 960) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const image = new Image()
      image.onerror = reject
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function validate(form) {
  const errors = {}
  const total = Number(form.totalRooms)
  if (!form.name.trim()) errors.name = 'Enter the name of your boarding house.'
  if (!form.address.trim()) errors.address = 'Enter the street address so boarders can find it.'
  if (!(Number(form.price) > 0)) errors.price = 'Enter the monthly rent.'
  if (!(total >= 1)) errors.totalRooms = 'Enter at least 1 room.'
  if (form.availableRooms === '' || Number(form.availableRooms) < 0) errors.availableRooms = 'Enter 0 or more.'
  else if (Number(form.availableRooms) > total) errors.availableRooms = 'Can’t be more than the total rooms.'
  if (form.availableSlots === '' || Number(form.availableSlots) < 0) errors.availableSlots = 'Enter 0 or more.'
  else if (Number(form.availableSlots) < Number(form.availableRooms)) errors.availableSlots = 'Should be at least the number of available rooms.'
  if (form.amenities.length === 0) errors.amenities = 'Pick at least one amenity.'
  return errors
}

function ListingForm({ listingId }) {
  const navigate = useNavigate()
  const { myListings, saveListing } = useData()
  const existing = listingId ? myListings.find((listing) => listing.id === listingId) : null

  const [form, setForm] = useState(() =>
    existing
      ? {
          ...EMPTY,
          ...existing,
          price: String(existing.price),
          totalRooms: String(existing.totalRooms),
          availableRooms: String(existing.availableRooms),
          availableSlots: String(existing.availableSlots),
        }
      : EMPTY,
  )
  const [errors, setErrors] = useState({})
  const [photoError, setPhotoError] = useState('')

  if (listingId && !existing) {
    return (
      <EmptyState
        icon={SearchX}
        title="Listing not found"
        body="It may have been deleted, or it belongs to another landlord."
        action={
          <Link to="/landlord/listings" className="btn btn-primary">
            Back to my listings
          </Link>
        }
      />
    )
  }

  // Editing a field clears its error; the rest are re-checked on submit.
  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors(({ [key]: _cleared, ...rest }) => rest)
  }
  const set = (key) => (event) => setField(key, event.target.value)
  const setNumber = (key) => (event) => setField(key, event.target.value.replace(/\D/g, '').slice(0, 6))

  function toggleAmenity(amenity) {
    setErrors(({ amenities: _cleared, ...rest }) => rest)
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity) ? current.amenities.filter((item) => item !== amenity) : [...current.amenities, amenity],
    }))
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setPhotoError('Choose an image file (JPG or PNG).')
    if (file.size > 10 * 1024 * 1024) return setPhotoError('Choose an image smaller than 10 MB.')
    try {
      const photo = await resizeImage(file)
      setForm((current) => ({ ...current, photo }))
      setPhotoError('')
    } catch {
      setPhotoError('That image couldn’t be read. Try another file.')
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const fields = {
      name: form.name.trim(),
      area: form.area,
      address: form.address.trim(),
      price: Number(form.price),
      roomType: form.roomType,
      totalRooms: Number(form.totalRooms),
      availableRooms: Number(form.availableRooms),
      availableSlots: Number(form.availableSlots),
      amenities: AMENITIES.filter((amenity) => form.amenities.includes(amenity)),
      description: form.description.trim(),
      photo: form.photo,
    }
    const id = saveListing(fields, existing?.id)
    navigate(`/landlord/listings/${id}`, { state: { saved: existing ? 'updated' : 'created' } })
  }

  const errorCount = Object.keys(errors).length
  const backTo = existing ? `/landlord/listings/${existing.id}` : '/landlord/listings'

  return (
    <div className="content-narrow">
      <PageHeader
        back={
          <Link to={backTo} className="d-inline-flex align-items-center gap-1 small fw-medium link-secondary text-decoration-none mb-2">
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </Link>
        }
        title={existing ? `Edit ${existing.name}` : 'Add New Listing'}
        subtitle={existing ? 'Changes are visible to boarders right away.' : 'New listings are reviewed by an admin before boarders can see them.'}
      />

      <form onSubmit={handleSubmit} noValidate className="d-flex flex-column gap-4">
        {errorCount > 0 && <Notice tone="error">Please fix the {errorCount === 1 ? 'highlighted field' : `${errorCount} highlighted fields`} below.</Notice>}

        <section className="card">
          <div className="card-body p-4 d-flex flex-column gap-3">
            <h2 className="fs-6 fw-semibold mb-0">Basic information</h2>
            <TextField id="name" label="Boarding house name" placeholder="e.g. Sunrise Boarding House" value={form.name} onChange={set('name')} error={errors.name} />
            <div className="row g-3">
              <div className="col-sm-6">
                <SelectField id="area" label="Location" value={form.area} onChange={set('area')}>
                  {AREAS.map((area) => (
                    <option key={area}>{area}</option>
                  ))}
                </SelectField>
              </div>
              <div className="col-sm-6">
                <TextField id="address" label="Street address" placeholder="e.g. 12 Rizal St., Zone 3" value={form.address} onChange={set('address')} error={errors.address} />
              </div>
            </div>
            <TextArea
              id="description"
              label="Description"
              hint="Mention house rules, what’s included in the rent and nearby landmarks."
              maxLength={800}
              value={form.description}
              onChange={set('description')}
            />
          </div>
        </section>

        <section className="card">
          <div className="card-body p-4 d-flex flex-column gap-3">
            <h2 className="fs-6 fw-semibold mb-0">Rooms and pricing</h2>
            <div className="row g-3">
              <div className="col-sm-6">
                <TextField id="price" label="Monthly rent (₱)" inputMode="numeric" placeholder="3000" value={form.price} onChange={setNumber('price')} error={errors.price} />
              </div>
              <div className="col-sm-6">
                <SelectField id="roomType" label="Room type" value={form.roomType} onChange={set('roomType')}>
                  {ROOM_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </SelectField>
              </div>
              <div className="col-sm-4">
                <TextField id="totalRooms" label="Total rooms" inputMode="numeric" value={form.totalRooms} onChange={setNumber('totalRooms')} error={errors.totalRooms} />
              </div>
              <div className="col-sm-4">
                <TextField id="availableRooms" label="Rooms available" inputMode="numeric" value={form.availableRooms} onChange={setNumber('availableRooms')} error={errors.availableRooms} />
              </div>
              <div className="col-sm-4">
                <TextField
                  id="availableSlots"
                  label="Open slots (beds)"
                  inputMode="numeric"
                  hint="Shared rooms can have several slots."
                  value={form.availableSlots}
                  onChange={setNumber('availableSlots')}
                  error={errors.availableSlots}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-body p-4">
            <h2 className="fs-6 fw-semibold mb-3">Amenities</h2>
            <div className="row g-2">
              {AMENITIES.map((amenity) => {
                const Icon = FEATURE_ICONS[amenity]
                const checked = form.amenities.includes(amenity)
                return (
                  <div key={amenity} className="col-6 col-sm-3">
                    <label className={`choice ${checked ? 'checked' : ''}`}>
                      <input type="checkbox" className="form-check-input" checked={checked} onChange={() => toggleAmenity(amenity)} />
                      <Icon size={16} className="text-body-secondary" aria-hidden="true" />
                      {amenity}
                    </label>
                  </div>
                )
              })}
            </div>
            {errors.amenities && <div className="invalid-feedback d-block">{errors.amenities}</div>}
          </div>
        </section>

        <section className="card">
          <div className="card-body p-4">
            <h2 className="fs-6 fw-semibold mb-1">Photo</h2>
            <p className="small text-body-secondary mb-3">A clear photo of the house or a room gets more reservation requests.</p>
            <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
              <div className="dashed-box bg-page rounded-3 overflow-hidden flex-shrink-0" style={{ width: '14rem', maxWidth: '100%' }}>
                <div className="ratio" style={{ '--bs-aspect-ratio': '62.5%' }}>
                  {form.photo ? (
                    <img src={form.photo} alt="Listing preview" />
                  ) : (
                    <div className="d-grid" style={{ placeItems: 'center' }}>
                      <ImagePlus size={32} className="text-body-secondary" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <label className="btn btn-outline-secondary mb-0">
                  <ImagePlus size={16} aria-hidden="true" />
                  {form.photo ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/*" onChange={handlePhoto} className="visually-hidden" />
                </label>
                {form.photo && (
                  <button type="button" onClick={() => setForm((current) => ({ ...current, photo: null }))} className="btn btn-outline-danger">
                    <Trash2 size={16} aria-hidden="true" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            {photoError && <div className="invalid-feedback d-block">{photoError}</div>}
          </div>
        </section>

        <div className="d-flex flex-column-reverse flex-sm-row justify-content-sm-end gap-2">
          <Link to={backTo} className="btn btn-outline-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary">
            {existing ? 'Save changes' : 'Submit for review'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Keyed by listing so switching between "add" and "edit" starts from a fresh form.
export default function ListingFormPage() {
  const { listingId } = useParams()
  return <ListingForm key={listingId ?? 'new'} listingId={listingId} />
}
