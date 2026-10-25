import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, DoorOpen, GraduationCap, House, MapPin, MessageCircle, Navigation, Phone, SearchX, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { availabilityOf, BAYBAY_CENTER, distanceKm, formatDate, formatDistance, formatPeso, VSU_COORDS } from '../../data/mockData'
import MapView from '../../components/map/MapView'
import PhotoGallery from '../../components/listings/PhotoGallery'
import { FavoriteButton, FeatureList } from '../../components/listings/RoomCard'
import ReviewsSection from '../../components/reviews/ReviewsSection'
import { RatingBadge } from '../../components/reviews/Stars'
import { TextArea, TextField } from '../../components/ui/form'
import { EmptyState, Notice, StatusPill, Tag } from '../../components/ui'

function ReservePanel({ listing }) {
  const { user } = useAuth()
  const { myReservations, createReservation, setReservationStatus } = useData()
  const [moveIn, setMoveIn] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()
  const [todayIso] = useState(() => new Date().toLocaleDateString('en-CA'))

  const active = myReservations.find((item) => item.listingId === listing.id && ['Pending', 'Approved'].includes(item.status))
  const isFull = listing.availableRooms === 0

  function handleSubmit(event) {
    event.preventDefault()
    if (!moveIn) return setError('Choose your preferred move-in date.')
    if (moveIn < todayIso) return setError('The move-in date can’t be in the past.')
    createReservation({ boarder: user, listing, roomType: listing.roomType, moveIn, message: message.trim() })
    setError('')
    toast('Reservation request sent! You’ll be notified when the landlord responds.')
  }

  return (
    <div className="card">
      <div className="card-body p-4">
        <p className="small text-body-secondary mb-1">
          <span className="fs-3 fw-bold text-body">{formatPeso(listing.price)}</span> / month
        </p>
        <p className="small text-body-secondary mb-0">{isFull ? 'No rooms available right now' : `${listing.availableRooms} of ${listing.totalRooms} rooms available`}</p>

        {active ? (
          <div className="d-flex flex-column gap-3 mt-4">
            <div className="border rounded-3 p-3 small">
              <div className="d-flex align-items-center justify-content-between">
                <span className="fw-medium">Your reservation</span>
                <StatusPill status={active.status} />
              </div>
              <p className="text-body-secondary mt-2 mb-0">
                {active.roomType} · move-in {active.moveIn ? formatDate(active.moveIn) : 'to be arranged'}
              </p>
            </div>
            <Link to="/boarder/reservations" className="btn btn-primary w-100">
              View my reservations
            </Link>
            {active.status === 'Pending' && (
              <button
                type="button"
                onClick={() => {
                  setReservationStatus(active.id, 'Cancelled')
                  toast('Reservation request cancelled.', 'info')
                }}
                className="btn btn-outline-danger w-100"
              >
                Cancel request
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="d-flex flex-column gap-3 mt-4">
            <div className="bg-page rounded-3 px-3 py-2 small">
              Room type: <strong>{listing.roomType}</strong>
            </div>
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
            <button type="submit" className="btn btn-primary w-100" style={{ height: '2.75rem' }} disabled={isFull}>
              <CalendarCheck size={16} aria-hidden="true" />
              {isFull ? 'Fully booked' : 'Request reservation'}
            </button>
            <p className="text-xs text-body-secondary text-center mb-0">You won’t be charged. The landlord confirms availability first.</p>
          </form>
        )}
      </div>
    </div>
  )
}

function LocationCard({ listing }) {
  const markers = useMemo(() => [{ id: listing.id, coords: listing.coords, label: listing.name, active: true }], [listing.id, listing.coords, listing.name])
  const places = [
    { icon: GraduationCap, label: 'Visayas State University', distance: distanceKm(listing.coords, VSU_COORDS) },
    { icon: MapPin, label: 'Baybay town center', distance: distanceKm(listing.coords, BAYBAY_CENTER) },
  ]
  const [lat, lng] = listing.coords

  return (
    <section className="card">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
          <h2 className="h5 fw-semibold mb-0">Location</h2>
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
        <MapView markers={markers} style={{ height: '16rem' }} label={`Map showing ${listing.name}`} />
        <ul className="list-unstyled row g-2 small mt-2 mb-0">
          {places.map(({ icon: Icon, label, distance }) => (
            <li key={label} className="col-sm-6">
              <div className="fact-tile d-flex align-items-center gap-2">
                <Icon size={16} className="text-primary flex-shrink-0" aria-hidden="true" />
                <span className="flex-grow-1">{label}</span>
                <strong>{formatDistance(distance)}</strong>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-body-secondary mt-2 mb-0">Straight-line distance. The pin shows the approximate location.</p>
      </div>
    </section>
  )
}

export default function RoomDetails() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { publicListings, favorites, toggleFavorite, recordView, ownerOf, ratingOf, startConversation } = useData()
  const listing = publicListings.find((item) => item.id === listingId)

  useEffect(() => {
    if (listing) recordView(listing.id)
  }, [listing, recordView])

  if (!listing) {
    return (
      <EmptyState
        icon={SearchX}
        title="This listing isn’t available"
        body="It may have been removed or is still waiting for approval."
        action={
          <Link to="/boarder/browse" className="btn btn-primary">
            Browse rooms
          </Link>
        }
      />
    )
  }

  const owner = ownerOf(listing)
  const facts = [
    { icon: House, label: 'Room type', value: listing.roomType },
    { icon: DoorOpen, label: 'Rooms available', value: `${listing.availableRooms} of ${listing.totalRooms}` },
    { icon: Users, label: 'Open slots', value: listing.availableSlots },
  ]

  return (
    <div>
      <Link to="/boarder/browse" className="d-inline-flex align-items-center gap-1 small fw-medium link-secondary text-decoration-none mb-3">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to browse
      </Link>

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
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {owner.phone && (
                  <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="btn btn-outline-secondary">
                    <Phone size={16} aria-hidden="true" />
                    {owner.phone}
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const id = startConversation({ listing, boarderId: user.id, boarderName: user.name, landlordName: owner.name })
                    navigate(`/boarder/messages/${id}`)
                  }}
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  Message landlord
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="col-lg-4">
          <div className="sticky-lg">
            <ReservePanel listing={listing} />
          </div>
        </aside>
      </div>
    </div>
  )
}
