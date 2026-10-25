import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, SearchX, Star, X } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { AMENITIES, AREA_CENTERS, AREAS, ROOM_TYPES } from '../../data/mockData'
import MapView from '../../components/map/MapView'
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
  photos: [],
  coords: AREA_CENTERS[AREAS[0]],
}

const MAX_PHOTOS = 5

// Shrinks an uploaded photo so several fit comfortably in localStorage.
function resizeImage(file, maxSize = 1024) {
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
        resolve(canvas.toDataURL('image/jpeg', 0.72))
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
  const toast = useToast()
  const existing = listingId ? myListings.find((listing) => listing.id === listingId) : null

  const [form, setForm] = useState(() =>
    existing
      ? {
          ...EMPTY,
          ...existing,
          photos: existing.photos ?? [],
          price: String(existing.price),
          totalRooms: String(existing.totalRooms),
          availableRooms: String(existing.availableRooms),
          availableSlots: String(existing.availableSlots),
        }
      : EMPTY,
  )
  const [errors, setErrors] = useState({})
  const [photoError, setPhotoError] = useState('')
  const [pinMoved, setPinMoved] = useState(Boolean(existing))
  const pinMarkers = useMemo(() => [{ id: 'pin', coords: form.coords, label: form.name.trim() || 'Your boarding house', active: true }], [form.coords, form.name])

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
  // Until the landlord drops a pin, the pin follows the chosen area.
  const setArea = (event) => {
    const area = event.target.value
    setForm((current) => ({ ...current, area, coords: pinMoved ? current.coords : AREA_CENTERS[area] }))
  }
  const setNumber = (key) => (event) => setField(key, event.target.value.replace(/\D/g, '').slice(0, 6))

  function toggleAmenity(amenity) {
    setErrors(({ amenities: _cleared, ...rest }) => rest)
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity) ? current.amenities.filter((item) => item !== amenity) : [...current.amenities, amenity],
    }))
  }

  async function handlePhotos(event) {
    const files = [...(event.target.files ?? [])]
    event.target.value = ''
    if (!files.length) return
    const room = MAX_PHOTOS - form.photos.length
    const images = files.filter((file) => file.type.startsWith('image/'))
    const problems = []
    if (images.length < files.length) problems.push('Only image files (JPG or PNG) can be added.')
    if (images.length > room) problems.push(`You can add up to ${MAX_PHOTOS} photos.`)
    const accepted = images.slice(0, Math.max(room, 0)).filter((file) => {
      if (file.size <= 10 * 1024 * 1024) return true
      problems.push(`${file.name} is larger than 10 MB.`)
      return false
    })
    const added = []
    for (const file of accepted) {
      try {
        added.push(await resizeImage(file))
      } catch {
        problems.push(`${file.name} couldn’t be read.`)
      }
    }
    if (added.length) setForm((current) => ({ ...current, photos: [...current.photos, ...added].slice(0, MAX_PHOTOS) }))
    setPhotoError(problems.join(' '))
  }

  const removePhoto = (position) => setForm((current) => ({ ...current, photos: current.photos.filter((_, index) => index !== position) }))
  const makeCover = (position) =>
    setForm((current) => ({ ...current, photos: [current.photos[position], ...current.photos.filter((_, index) => index !== position)] }))

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
      photos: form.photos,
      coords: form.coords,
    }
    const id = saveListing(fields, existing?.id)
    toast(existing ? 'Listing updated.' : 'Listing submitted for review.')
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
                <SelectField id="area" label="Location" value={form.area} onChange={setArea}>
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
          <div className="card-body p-4">
            <h2 className="fs-6 fw-semibold mb-1">Map pin</h2>
            <p className="small text-body-secondary mb-3">Click the map where your boarding house is so boarders can see how far it is from school and town.</p>
            <MapView
              markers={pinMarkers}
              onMapClick={(coords) => {
                setPinMoved(true)
                setForm((current) => ({ ...current, coords }))
              }}
              style={{ height: '16rem', cursor: 'crosshair' }}
              label="Pick the location of your boarding house"
            />
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
              <span className="text-xs text-body-secondary">
                {form.coords[0].toFixed(5)}, {form.coords[1].toFixed(5)}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setPinMoved(false)
                  setForm((current) => ({ ...current, coords: AREA_CENTERS[current.area] }))
                }}
              >
                Reset to {form.area}
              </button>
            </div>
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
            <div className="d-flex align-items-baseline justify-content-between gap-2">
              <h2 className="fs-6 fw-semibold mb-1">Photos</h2>
              <span className="text-xs text-body-secondary">
                {form.photos.length} / {MAX_PHOTOS}
              </span>
            </div>
            <p className="small text-body-secondary mb-3">Clear photos of the house and rooms get more reservation requests. The first photo is the cover.</p>
            <div className="row g-2">
              {form.photos.map((src, position) => (
                <div key={`${position}-${src.slice(-24)}`} className="col-6 col-sm-4">
                  <div className="photo-tile">
                    <div className="ratio" style={{ '--bs-aspect-ratio': '62.5%' }}>
                      <img src={src} alt={`Listing photo ${position + 1}`} />
                    </div>
                    {position === 0 && <span className="badge text-bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">Cover</span>}
                    <div className="tile-actions">
                      {position > 0 && (
                        <button type="button" className="btn btn-sm btn-light px-2" onClick={() => makeCover(position)} aria-label={`Make photo ${position + 1} the cover`} title="Make cover">
                          <Star size={14} />
                        </button>
                      )}
                      <button type="button" className="btn btn-sm btn-light px-2 text-danger" onClick={() => removePhoto(position)} aria-label={`Remove photo ${position + 1}`} title="Remove">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {form.photos.length < MAX_PHOTOS && (
                <div className="col-6 col-sm-4">
                  <label className="photo-add ratio mb-0" style={{ '--bs-aspect-ratio': '62.5%' }}>
                    <span className="d-grid align-content-center justify-items-center gap-1" style={{ placeItems: 'center' }}>
                      <ImagePlus size={24} aria-hidden="true" />
                      Add photos
                      <input type="file" accept="image/*" multiple onChange={handlePhotos} className="visually-hidden" />
                    </span>
                  </label>
                </div>
              )}
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
