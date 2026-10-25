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
          <Link to="/landlord/listings" className="btn-primary">
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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={
          <Link to={existing ? `/landlord/listings/${existing.id}` : '/landlord/listings'} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
        }
        title={existing ? `Edit ${existing.name}` : 'Add New Listing'}
        subtitle={existing ? 'Changes are visible to boarders right away.' : 'New listings are reviewed by an admin before boarders can see them.'}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {errorCount > 0 && <Notice tone="error">Please fix the {errorCount === 1 ? 'highlighted field' : `${errorCount} highlighted fields`} below.</Notice>}

        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-semibold">Basic information</h2>
          <TextField id="name" label="Boarding house name" placeholder="e.g. Sunrise Boarding House" value={form.name} onChange={set('name')} error={errors.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField id="area" label="Location" value={form.area} onChange={set('area')}>
              {AREAS.map((area) => (
                <option key={area}>{area}</option>
              ))}
            </SelectField>
            <TextField id="address" label="Street address" placeholder="e.g. 12 Rizal St., Zone 3" value={form.address} onChange={set('address')} error={errors.address} />
          </div>
          <TextArea
            id="description"
            label="Description"
            hint="Mention house rules, what’s included in the rent and nearby landmarks."
            maxLength={800}
            value={form.description}
            onChange={set('description')}
          />
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-semibold">Rooms and pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="price" label="Monthly rent (₱)" inputMode="numeric" placeholder="3000" value={form.price} onChange={setNumber('price')} error={errors.price} />
            <SelectField id="roomType" label="Room type" value={form.roomType} onChange={set('roomType')}>
              {ROOM_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField id="totalRooms" label="Total rooms" inputMode="numeric" value={form.totalRooms} onChange={setNumber('totalRooms')} error={errors.totalRooms} />
            <TextField id="availableRooms" label="Rooms available" inputMode="numeric" value={form.availableRooms} onChange={setNumber('availableRooms')} error={errors.availableRooms} />
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
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold">Amenities</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AMENITIES.map((amenity) => {
              const Icon = FEATURE_ICONS[amenity]
              const checked = form.amenities.includes(amenity)
              return (
                <label
                  key={amenity}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${checked ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent/50'}`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleAmenity(amenity)} className="size-4 accent-accent" />
                  <Icon className="size-4 text-muted" aria-hidden="true" />
                  {amenity}
                </label>
              )
            })}
          </div>
          {errors.amenities && <p className="mt-2 text-xs text-red-600">{errors.amenities}</p>}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold">Photo</h2>
          <p className="mt-1 text-sm text-muted">A clear photo of the house or a room gets more reservation requests.</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid aspect-[16/10] w-full shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-page sm:w-56">
              {form.photo ? <img src={form.photo} alt="Listing preview" className="size-full object-cover" /> : <ImagePlus className="size-8 text-muted" aria-hidden="true" />}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="btn cursor-pointer border border-line hover:bg-page">
                <ImagePlus className="size-4" aria-hidden="true" />
                {form.photo ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
              </label>
              {form.photo && (
                <button type="button" onClick={() => setForm((current) => ({ ...current, photo: null }))} className="btn border border-line text-red-600 hover:bg-red-50">
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          </div>
          {photoError && <p className="mt-2 text-xs text-red-600">{photoError}</p>}
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to={existing ? `/landlord/listings/${existing.id}` : '/landlord/listings'} className="btn border border-line bg-white hover:bg-page">
            Cancel
          </Link>
          <button type="submit" className="btn-primary">
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
