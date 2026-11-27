import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, CircleHelp, DoorOpen, GraduationCap, House, Link2, LoaderCircle, LocateFixed, LogIn, MapPin, MessageCircle, Navigation, Phone, SearchX, Users } from 'lucide-react'
import { publicUrl } from '../../config/base'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useRequireBoarder, useSitePaths } from '../../context/SitePaths'
import { useToast } from '../../context/ToastContext'
import { availabilityOf, BAYBAY_CENTER, distanceKm, formatDate, formatDistance, formatPeso, rentLabel, SHARED_ROOM_TYPES, UTILITIES, VSU_COORDS } from '../../data/mockData'
import MapView from '../../components/map/MapView'
import useMyLocation from '../../components/map/useMyLocation'
import PhotoGallery from '../../components/listings/PhotoGallery'
import LivingHere from '../../components/listings/LivingHere'
import { FavoriteButton, FeatureList } from '../../components/listings/RoomCard'
import ReviewsSection from '../../components/reviews/ReviewsSection'
import RoomsTable from '../../components/listings/RoomsTable'
import useListingRooms from '../../components/listings/useListingRooms'
import { freeSlotsOf } from '../../data/rooms'
import { RatingBadge } from '../../components/reviews/Stars'
import CopyButton from '../../components/ui/CopyButton'
import { SelectField, TextArea, TextField } from '../../components/ui/form'
import { ListingsError } from '../../components/listings/ListingsStatus'
import { EmptyState, Notice, StatusPill, Tag } from '../../components/ui'
import { PageSkeleton } from '../../components/ui/feedback'

// Shown instead of the reservation form to guests and to landlord or admin accounts.
function SignInToReserve({ listing }) {
  const { user } = useAuth()
  const location = useLocation()
  const from = location.pathname + location.search
  const isFull = listing.availableRooms === 0

  return (
    <div className="card">
      <div className="card-body p-4">
        <p className="small text-body-secondary mb-1">
          <span className="fs-3 fw-bold text-body">{rentLabel(listing)}</span> / month
        </p>
        <p className="small text-body-secondary mb-0">{isFull ? 'No rooms available right now' : `${listing.availableRooms} of ${listing.totalRooms} rooms available`}</p>
        {user ? (
          <div className="mt-4">
            <Notice tone="info">Reservations are sent from boarder accounts. You’re signed in as a landlord.</Notice>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2 mt-4">
            <Link to="/login" state={{ from, role: 'boarder' }} className="btn btn-primary w-100" style={{ height: '2.75rem' }}>
              <LogIn size={16} aria-hidden="true" />
              Sign in to request a room
            </Link>
            <Link to="/signup" state={{ from, role: 'boarder' }} className="btn btn-outline-secondary w-100">
              Create a free account
            </Link>
            <p className="text-xs text-body-secondary text-center mt-1 mb-0">Browsing is free. An account is only needed to save, reserve or message.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// A boarder's request for one of the rooms with a free bed, or their request in progress.
function ReservePanel({ listing, rooms }) {
  const { myReservations, createReservation, setReservationStatus } = useData()
  const [roomId, setRoomId] = useState('')
  const [moveIn, setMoveIn] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const [todayIso] = useState(() => new Date().toLocaleDateString('en-CA'))
  // An approved request shows here around move-in; after that the boarder can ask again.
  const [recentIso] = useState(() => new Date(Date.now() - 30 * 86400000).toLocaleDateString('en-CA'))

  const active = myReservations.find(
    (item) => item.listingId === listing.id && (item.status === 'Pending' || (item.status === 'Approved' && (item.moveIn ?? todayIso) >= recentIso)),
  )
  const openRooms = rooms.rooms.filter((room) => freeSlotsOf(room) > 0)
  const room = openRooms.find((item) => String(item.id) === roomId) ?? openRooms[0]
  const isFull = !rooms.loading && !room

  async function handleSubmit(event) {
    event.preventDefault()
    if (!room) return setError('Choose a room.')
    if (!moveIn) return setError('Choose your preferred move-in date.')
    if (moveIn < todayIso) return setError('The move-in date can’t be in the past.')
    setBusy(true)
    const result = await createReservation({ listing, room, moveIn, message: message.trim() })
    setBusy(false)
    if (!result.ok) return setError(result.fields?.moveIn ?? result.error)
    setError('')
    setMessage('')
    toast('Reservation request sent! You’ll be notified when the landlord responds.')
  }

  async function cancel() {
    setBusy(true)
    const result = await setReservationStatus(active, 'Cancelled')
    setBusy(false)
    toast(result.ok ? 'Reservation request cancelled.' : result.error, result.ok ? 'info' : 'error')
  }

  return (
    <div className="card">
      <div className="card-body p-4">
        <p className="small text-body-secondary mb-1">
          <span className="fs-3 fw-bold text-body">{rentLabel(listing)}</span> / month
        </p>
        <p className="small text-body-secondary mb-0">{listing.availableRooms === 0 ? 'No rooms available right now' : `${listing.availableRooms} of ${listing.totalRooms} rooms available`}</p>

        {active ? (
          <div className="d-flex flex-column gap-3 mt-4">
            <div className="border rounded-3 p-3 small">
              <div className="d-flex align-items-center justify-content-between">
                <span className="fw-medium">Your reservation</span>
                <StatusPill status={active.status} />
              </div>
              <p className="text-body-secondary mt-2 mb-0">
                {active.roomName ? `${active.roomName} · ` : ''}
                {active.roomType} · move-in {active.moveIn ? formatDate(active.moveIn) : 'to be arranged'}
              </p>
            </div>
            <Link to="/boarder/reservations" className="btn btn-primary w-100">
              View my reservations
            </Link>
            {active.status === 'Pending' && (
              <button type="button" onClick={cancel} className="btn btn-outline-danger w-100" disabled={busy}>
                Cancel request
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="d-flex flex-column gap-3 mt-4">
            {rooms.loading ? (
              <div className="placeholder-glow" aria-busy="true" aria-label="Loading rooms">
                <span className="placeholder col-12 rounded-3" style={{ height: '2.75rem' }} />
              </div>
            ) : room ? (
              <SelectField id="room" label="Room" value={String(room.id)} onChange={(event) => setRoomId(event.target.value)}>
                {openRooms.map((item) => {
                  const free = freeSlotsOf(item)
                  return (
                    <option key={item.id} value={String(item.id)}>
                      {item.name} · {item.type} · {formatPeso(item.rent)} · {free} free {free === 1 ? 'bed' : 'beds'}
                    </option>
                  )
                })}
              </SelectField>
            ) : null}
            <TextField id="move-in" label="Preferred move-in date" type="date" min={todayIso} value={moveIn} onChange={(event) => setMoveIn(event.target.value)} disabled={isFull} />
            <TextArea
              id="message"
              label="Message to landlord (optional)"
              placeholder="Introduce yourself, e.g. school, course and how long you plan to stay."
              maxLength={500}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={isFull}
            />
            {error && <Notice tone="error">{error}</Notice>}
            <button type="submit" className="btn btn-primary w-100" style={{ height: '2.75rem' }} disabled={isFull || busy || rooms.loading}>
              {busy ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <CalendarCheck size={16} aria-hidden="true" />}
              {isFull ? 'Fully booked' : busy ? 'Sending…' : 'Request reservation'}
            </button>
            <p className="text-xs text-body-secondary text-center mb-0">You won’t be charged. The landlord confirms availability first.</p>
          </form>
        )}
      </div>
    </div>
  )
}

function LocationCard({ listing }) {
  const { position, locating, locate } = useMyLocation()
  const [showMe, setShowMe] = useState(false)
  const me = showMe ? position : null
  const markers = useMemo(
    () => [
      { id: listing.id, coords: listing.coords, label: listing.name, active: true },
      ...(me ? [{ id: 'me', kind: 'me', coords: me, label: 'You are here' }] : []),
    ],
    [listing.id, listing.coords, listing.name, me],
  )
  const places = [
    { icon: GraduationCap, label: 'Visayas State University', distance: distanceKm(listing.coords, VSU_COORDS) },
    { icon: MapPin, label: 'Baybay town center', distance: distanceKm(listing.coords, BAYBAY_CENTER) },
    ...(me ? [{ icon: LocateFixed, label: 'From where you are', distance: distanceKm(listing.coords, me) }] : []),
  ]
  const [lat, lng] = listing.coords

  return (
    <section className="card">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h2 className="h5 fw-semibold mb-0">Location</h2>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn btn-sm ${me ? 'btn-primary' : 'btn-outline-secondary'}`}
              aria-pressed={Boolean(me)}
              disabled={locating}
              onClick={() => (me ? setShowMe(false) : position ? setShowMe(true) : locate(() => setShowMe(true)))}
            >
              {locating ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : <LocateFixed size={14} aria-hidden="true" />}
              {locating ? 'Finding you…' : me ? 'Hide my location' : 'Show my location'}
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-secondary"
            >
              <Navigation size={14} aria-hidden="true" />
              Get directions
            </a>
          </div>
        </div>
        <MapView markers={markers} style={{ height: '16rem' }} label={`Map showing ${listing.name}`} />
        <ul className="list-unstyled row g-2 small mt-2 mb-0">
          {places.map(({ icon: Icon, label, distance }) => (
            <li key={label} className={places.length === 3 ? 'col-sm-4' : 'col-sm-6'}>
              <div className="fact-tile d-flex align-items-center gap-2 h-100">
                <Icon size={16} className="text-primary flex-shrink-0" aria-hidden="true" />
                <span className="flex-grow-1">{label}</span>
                <strong className="text-nowrap">{formatDistance(distance)}</strong>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-body-secondary mt-2 mb-0">Straight-line distance. The pin shows the approximate location. Your location stays on this device.</p>
      </div>
    </section>
  )
}

// Each room with its own type, rent and free slots (from MySQL).
function RoomsList({ listing, rooms: state }) {
  if (!state.loading && !state.error && state.rooms.length === 0) return null
  return (
    <section className="card">
      <div className="card-body p-4">
        <div className="d-flex align-items-baseline justify-content-between gap-2 mb-3">
          <h2 className="h5 fw-semibold mb-0">Rooms</h2>
          {!state.loading && !state.error && (
            <span className="small text-body-secondary">
              {listing.availableRooms} of {state.rooms.length} with a free slot
            </span>
          )}
        </div>
        {state.loading ? (
          <div className="placeholder-glow" aria-busy="true">
            <span className="placeholder col-12 rounded" style={{ height: '6rem' }} />
          </div>
        ) : state.error ? (
          <p className="small text-body-secondary mb-0">{state.error}</p>
        ) : (
          <RoomsTable rooms={state.rooms} />
        )}
      </div>
    </section>
  )
}

// Questions for things the listing leaves open, so boarders know what to ask before visiting.
function questionsFor(listing) {
  const missingBills = UTILITIES.filter((name) => !listing.utilities.some((utility) => utility.name === name))
  return [
    'Is an advance or a deposit needed, and how much?',
    missingBills.length > 0 && `How are ${missingBills.map((name) => name.toLowerCase()).join(', ')} paid for?`,
    !listing.curfew && 'Is there a gate-closing time at night?',
    SHARED_ROOM_TYPES.includes(listing.roomType) && 'How many boarders share each room right now?',
    listing.availableRooms === 0 ? 'When is the next room or slot expected to open?' : 'Can I visit and see the room before reserving?',
  ].filter(Boolean)
}

function WorthAsking({ listing, onAsk }) {
  return (
    <section className="card">
      <div className="card-body p-4">
        <h2 className="d-flex align-items-center gap-2 h5 fw-semibold mb-1">
          <CircleHelp size={18} className="text-primary" aria-hidden="true" />
          Worth asking the landlord
        </h2>
        <p className="small text-body-secondary mb-3">Things this listing doesn’t say. Tap one to send it as a message.</p>
        <div className="d-flex flex-column gap-2">
          {questionsFor(listing).map((question) => (
            <button key={question} type="button" className="btn btn-outline-secondary text-start justify-content-start fw-normal" onClick={() => onAsk(question)}>
              <MessageCircle size={16} className="text-primary flex-shrink-0" aria-hidden="true" />
              {question}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function RoomDetails() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const paths = useSitePaths()
  const requireBoarder = useRequireBoarder()
  const toast = useToast()
  const { publicListings, listingsReady, listingsError, reloadListings, favorites, toggleFavorite, recordView, ownerOf, ratingOf, startConversation } = useData()
  const listing = publicListings.find((item) => item.id === listingId)
  const rooms = useListingRooms(listing)

  // Once per listing opened (the data reloads every minute, which mustn't count again).
  const viewed = useRef(null)
  useEffect(() => {
    if (!listing || viewed.current === listing.id) return
    viewed.current = listing.id
    recordView(listing.id)
  }, [listing, recordView])

  if (!listingsReady) return <PageSkeleton />
  if (listingsError) return <ListingsError error={listingsError} onRetry={reloadListings} />
  if (!listing) {
    return (
      <EmptyState
        icon={SearchX}
        title="This listing isn’t available"
        body="It may have been removed or is still waiting for approval."
        action={
          <Link to={paths.browse} className="btn btn-primary">
            Browse rooms
          </Link>
        }
      />
    )
  }

  const owner = ownerOf(listing)
  const facts = [
    { icon: House, label: listing.roomTypes?.length > 1 ? 'Room types' : 'Room type', value: listing.roomTypes?.length ? listing.roomTypes.join(', ') : listing.roomType },
    { icon: DoorOpen, label: 'Rooms available', value: `${listing.availableRooms} of ${listing.totalRooms}` },
    { icon: Users, label: 'Open slots', value: listing.availableSlots },
  ]
  // The public address of this listing, whichever page it was opened from.
  const shareUrl = new URL(publicUrl(`rooms/${listing.id}`), window.location.origin).href

  async function messageLandlord(draft) {
    if (!requireBoarder('message the landlord')) return
    const result = await startConversation({ listing, boarderId: user.id, boarderName: user.name, landlordName: owner.name })
    if (!result.ok) return toast(result.error, 'error')
    navigate(`/boarder/messages/${result.id}`, { state: draft ? { draft } : undefined })
  }

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <Link to={paths.browse} className="d-inline-flex align-items-center gap-1 small fw-medium link-secondary text-decoration-none">
          <ArrowLeft size={16} aria-hidden="true" />
          {paths.isPublic ? 'Back to all places' : 'Back to browse'}
        </Link>
        <CopyButton text={shareUrl} icon={Link2} copiedMessage="Link copied. Share it with a friend." className="btn btn-sm btn-outline-secondary">
          Copy link
        </CopyButton>
      </div>

      <div className="row g-4">
        <div className="col-lg-8 d-flex flex-column gap-4">
          <PhotoGallery listing={listing} />

          <section className="card">
            <div className="card-body p-4">
              <div className="d-flex align-items-start justify-content-between gap-3">
                <div>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <h1 className="h4 fw-bold tracking-tight mb-0">{listing.name}</h1>
                    <Tag>{availabilityOf(listing)}</Tag>
                  </div>
                  <p className="d-flex align-items-center gap-1 small text-body-secondary mt-2 mb-0">
                    <MapPin size={16} className="flex-shrink-0" aria-hidden="true" />
                    {listing.address ? `${listing.address}, ` : ''}
                    {listing.area}, {listing.city}
                  </p>
                  <a href="#reviews" className="d-inline-block mt-2 text-decoration-none">
                    <RatingBadge rating={ratingOf(listing.id)} />
                  </a>
                </div>
                <FavoriteButton listing={listing} isFavorite={favorites.includes(listing.id)} onToggle={toggleFavorite} className="border flex-shrink-0" />
              </div>

              <dl className="row g-3 mt-2 mb-0">
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="col-4">
                    <div className="fact-tile h-100">
                      <Icon size={16} className="text-primary" aria-hidden="true" />
                      <dt className="text-xs fw-normal text-body-secondary mt-2">{label}</dt>
                      <dd className="small fw-semibold mb-0">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <h2 className="fs-6 fw-semibold mt-4 mb-2">About this place</h2>
              <p className="small mb-0" style={{ lineHeight: 1.7 }}>
                {listing.description || 'No description yet.'}
              </p>

              <h2 className="fs-6 fw-semibold mt-4 mb-3">Amenities</h2>
              <FeatureList features={listing.amenities} className="small" iconSize={16} />
            </div>
          </section>

          <RoomsList listing={listing} rooms={rooms} />

          <LivingHere listing={listing} />

          <LocationCard listing={listing} />

          <ReviewsSection listing={listing} />

          <section className="card">
            <div className="card-body p-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <span className="avatar avatar-soft">
                  {owner.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div>
                  <p className="text-xs text-body-secondary mb-0">Landlord</p>
                  <p className="fw-semibold mb-0">{owner.name}</p>
                  {owner.phone && <p className="small text-body-secondary mb-0">{owner.phone}</p>}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {owner.phone && (
                  <>
                    <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="btn btn-outline-secondary">
                      <Phone size={16} aria-hidden="true" />
                      Call
                    </a>
                    <CopyButton text={owner.phone} copiedMessage="Number copied.">
                      Copy number
                    </CopyButton>
                  </>
                )}
                <button type="button" className="btn btn-primary" onClick={() => messageLandlord()}>
                  <MessageCircle size={16} aria-hidden="true" />
                  Message landlord
                </button>
              </div>
            </div>
          </section>

          <WorthAsking listing={listing} onAsk={messageLandlord} />
        </div>

        <aside className="col-lg-4">
          <div className="sticky-lg">{user?.role === 'boarder' ? <ReservePanel key={listing.id} listing={listing} rooms={rooms} /> : <SignInToReserve listing={listing} />}</div>
        </aside>
      </div>
    </div>
  )
}
