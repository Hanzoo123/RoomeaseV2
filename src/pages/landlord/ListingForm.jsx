import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleAlert, ImagePlus, SearchX, Star, X } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { AMENITIES, AREA_CENTERS, AREAS, GENDER_POLICIES, PAYMENT_METHODS, ROOM_TYPES, UTILITIES } from '../../data/mockData'
import { resizeImage } from '../../data/images'
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
  curfew: '',
  minimumStayMonths: '',
  paymentMethods: ['Cash'],
  genderPolicy: 'any',
  visitorsAllowed: true,
  cookingAllowed: true,
  petsAllowed: false,
  // Edited as one rule per line, saved as a list.
  houseRulesText: '',
  // { [utility name]: how it is billed } for the bills the landlord ticks.
  utilities: {},
}

const CURFEWS = ['9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM']
const MINIMUM_STAYS = [1, 3, 5, 6, 10, 12]
const MAX_RULES = 10

const MAX_PHOTOS = 5

const rulesFrom = (text) =>
  text
    .split('\n')
    .map((line) => line.replace(/^[-•*\s]+/, '').trim())
    .filter(Boolean)

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
  const rules = rulesFrom(form.houseRulesText)
  if (rules.length > MAX_RULES) errors.houseRulesText = `Keep it to ${MAX_RULES} rules or fewer.`
  else if (rules.some((rule) => rule.length > 120)) errors.houseRulesText = 'Keep each rule under 120 characters.'
  if (Object.values(form.utilities).some((billing) => billing.length > 60)) errors.utilities = 'Keep each billing note under 60 characters.'
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
          curfew: existing.curfew ?? '',
          minimumStayMonths: existing.minimumStayMonths ? String(existing.minimumStayMonths) : '',
          houseRulesText: (existing.houseRules ?? []).join('\n'),
          utilities: Object.fromEntries((existing.utilities ?? []).map((utility) => [utility.name, utility.billing ?? ''])),
        }
      : EMPTY,
  )
  const [errors, setErrors] = useState({})
  const [photoError, setPhotoError] = useState('')
  const [pinMoved, setPinMoved] = useState(Boolean(existing))
  const pinMarkers = useMemo(() => [{ id: 'pin', coords: form.coords, label: form.name.trim() || 'Your boarding house', active: true }], [form.coords, form.name])

  const resubmitting = existing?.approval === 'Rejected'

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
      curfew: form.curfew || null,
      minimumStayMonths: form.minimumStayMonths ? Number(form.minimumStayMonths) : null,
      paymentMethods: PAYMENT_METHODS.filter((method) => form.paymentMethods.includes(method)),
      genderPolicy: form.genderPolicy,
      visitorsAllowed: form.visitorsAllowed,
      cookingAllowed: form.cookingAllowed,
      petsAllowed: form.petsAllowed,
      houseRules: rulesFrom(form.houseRulesText),
      utilities: UTILITIES.filter((name) => name in form.utilities).map((name) => ({ name, billing: form.utilities[name].trim() || 'Included in rent' })),
    }
    const id = saveListing(fields, existing?.id)
    toast(resubmitting ? 'Changes saved and sent back for review.' : existing ? 'Listing updated.' : 'Listing submitted for review.')
    navigate(`/landlord/listings/${id}`, { state: { saved: existing ? 'updated' : 'created' } })
  }

  const togglePayment = (method) =>
    setForm((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.includes(method) ? current.paymentMethods.filter((item) => item !== method) : [...current.paymentMethods, method],
    }))
  const toggleUtility = (name) => {
    setErrors(({ utilities: _cleared, ...rest }) => rest)
    setForm((current) => {
      const { [name]: removed, ...rest } = current.utilities
      return { ...current, utilities: removed === undefined ? { ...current.utilities, [name]: '' } : rest }
    })
  }
  const setBilling = (name, billing) => {
    setErrors(({ utilities: _cleared, ...rest }) => rest)
    setForm((current) => ({ ...current, utilities: { ...current.utilities, [name]: billing } }))
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
        subtitle={
          resubmitting
            ? 'Fix what the admin asked for, then save to send it back for review.'
            : existing
              ? 'Changes are visible to boarders right away.'
              : 'New listings are reviewed by an admin before boarders can see them.'
        }
      />

      <form onSubmit={handleSubmit} noValidate className="d-flex flex-column gap-4">
        {resubmitting && existing.rejectionReason && (
          <div className="alert alert-danger small d-flex gap-2 mb-0">
            <CircleAlert size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
            <span>
              <strong>What the admin asked for:</strong> {existing.rejectionReason}
            </span>
          </div>
        )}
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
              hint="What the house is like and nearby landmarks. House rules and bills have their own sections below."
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
          <div className="card-body p-4 d-flex flex-column gap-3">
            <div>
              <h2 className="fs-6 fw-semibold mb-1">Stay terms</h2>
              <p className="small text-body-secondary mb-0">Boarders see these on your listing, so they know the rules before they visit.</p>
            </div>
            <div className="row g-3">
              <div className="col-sm-4">
                <SelectField id="genderPolicy" label="Who can stay" value={form.genderPolicy} onChange={set('genderPolicy')}>
                  {Object.entries(GENDER_POLICIES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="col-sm-4">
                <SelectField id="curfew" label="Curfew" value={form.curfew} onChange={set('curfew')}>
                  <option value="">No curfew</option>
                  {[...new Set([...CURFEWS, ...(form.curfew ? [form.curfew] : [])])].map((time) => (
                    <option key={time} value={time}>
                      Gate closes {time}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="col-sm-4">
                <SelectField id="minimumStay" label="Minimum stay" value={form.minimumStayMonths} onChange={set('minimumStayMonths')}>
                  <option value="">No minimum</option>
                  {[...new Set([...MINIMUM_STAYS, ...(form.minimumStayMonths ? [Number(form.minimumStayMonths)] : [])])]
                    .sort((a, b) => a - b)
                    .map((months) => (
                      <option key={months} value={String(months)}>
                        {months} {months === 1 ? 'month' : 'months'}
                        {months === 5 ? ' (one semester)' : ''}
                      </option>
                    ))}
                </SelectField>
              </div>
            </div>
            <div className="d-flex flex-wrap column-gap-4 row-gap-2">
              {[
                ['visitorsAllowed', 'Visitors allowed'],
                ['cookingAllowed', 'Cooking allowed'],
                ['petsAllowed', 'Pets allowed'],
              ].map(([key, label]) => (
                <div key={key} className="form-check form-switch mb-0">
                  <input id={key} type="checkbox" role="switch" className="form-check-input" checked={Boolean(form[key])} onChange={(event) => setField(key, event.target.checked)} />
                  <label htmlFor={key} className="form-check-label small">
                    {label}
                  </label>
                </div>
              ))}
            </div>
            <fieldset>
              <legend className="form-label mb-2">Payment accepted</legend>
              <div className="d-flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <label key={method} className={`choice ${form.paymentMethods.includes(method) ? 'checked' : ''}`} style={{ width: 'auto' }}>
                    <input type="checkbox" className="form-check-input" checked={form.paymentMethods.includes(method)} onChange={() => togglePayment(method)} />
                    {method}
                  </label>
                ))}
              </div>
            </fieldset>
            <TextArea
              id="houseRulesText"
              label="House rules"
              hint={`One rule per line, up to ${MAX_RULES}. For example: Quiet hours from 10 PM to 6 AM.`}
              rows={4}
              placeholder={'Visitors in the lobby only, until 8 PM\nNo smoking inside the house\nRent is due every 5th of the month'}
              value={form.houseRulesText}
              onChange={set('houseRulesText')}
              error={errors.houseRulesText}
            />
          </div>
        </section>

        <section className="card">
          <div className="card-body p-4">
            <h2 className="fs-6 fw-semibold mb-1">Bills and what’s included</h2>
            <p className="small text-body-secondary mb-3">Tick each bill the rent covers or that you collect, and say how it’s charged. Anything left unticked shows as a question boarders can ask you.</p>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              {UTILITIES.map((name) => {
                const included = name in form.utilities
                return (
                  <li key={name} className="row g-2 align-items-center">
                    <div className="col-sm-5">
                      <label className={`choice ${included ? 'checked' : ''}`}>
                        <input type="checkbox" className="form-check-input" checked={included} onChange={() => toggleUtility(name)} />
                        {name}
                      </label>
                    </div>
                    <div className="col-sm-7">
                      <input
                        className="form-control"
                        aria-label={`How ${name.toLowerCase()} is billed`}
                        placeholder={included ? 'Included in rent' : 'Not included'}
                        disabled={!included}
                        maxLength={60}
                        value={form.utilities[name] ?? ''}
                        onChange={(event) => setBilling(name, event.target.value)}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
            {errors.utilities && <div className="invalid-feedback d-block">{errors.utilities}</div>}
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
            {resubmitting ? 'Save and resubmit' : existing ? 'Save changes' : 'Submit for review'}
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
