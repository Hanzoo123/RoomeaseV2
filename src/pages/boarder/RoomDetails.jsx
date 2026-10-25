import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, DoorOpen, House, MapPin, Phone, SearchX, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { availabilityOf, formatDate, formatPeso } from '../../data/mockData'
import HouseArt from '../../components/illustrations/HouseArt'
import RoomArt from '../../components/illustrations/RoomArt'
import { FavoriteButton, FeatureList } from '../../components/listings/RoomCard'
import { TextArea, TextField } from '../../components/ui/form'
import { EmptyState, ListingImage, Notice, StatusPill, Tag } from '../../components/ui'

function Gallery({ listing }) {
  const views = listing.photo ? ['photo', 'room', 'house'] : ['room', 'house']
  const [active, setActive] = useState(views[0])

  const render = (view, className) => {
    if (view === 'photo') return <ListingImage listing={listing} kind="room" className={className} />
    if (view === 'room') return <RoomArt variant={listing.art.room} className={className} />
    return <HouseArt variant={listing.art.house} className={className} />
  }

  return (
    <div>
      <div className="aspect-[16/9] overflow-hidden rounded-2xl">{render(active, 'size-full')}</div>
      <div className="mt-3 flex gap-3">
        {views.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setActive(view)}
            aria-label={`Show ${view === 'house' ? 'outside view' : 'room view'}`}
            aria-pressed={active === view}
            className={`aspect-[16/10] w-24 overflow-hidden rounded-lg ring-2 transition sm:w-28 ${active === view ? 'ring-accent' : 'ring-transparent opacity-75 hover:opacity-100'}`}
          >
            {render(view, 'size-full')}
          </button>
        ))}
      </div>
    </div>
  )
}

function ReservePanel({ listing }) {
  const { user } = useAuth()
  const { myReservations, createReservation, setReservationStatus } = useData()
  const [moveIn, setMoveIn] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const active = myReservations.find((item) => item.listingId === listing.id && ['Pending', 'Approved'].includes(item.status))
  const isFull = listing.availableRooms === 0
  const [todayIso] = useState(() => new Date().toLocaleDateString('en-CA'))

  function handleSubmit(event) {
    event.preventDefault()
    if (!moveIn) return setError('Choose your preferred move-in date.')
    if (moveIn < todayIso) return setError('The move-in date can’t be in the past.')
    createReservation({ boarder: user, listing, roomType: listing.roomType, moveIn, message: message.trim() })
    setError('')
    setSent(true)
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-muted">
        <span className="text-2xl font-bold text-ink">{formatPeso(listing.price)}</span> / month
      </p>
      <p className="mt-1 text-sm text-muted">
        {isFull ? 'No rooms available right now' : `${listing.availableRooms} of ${listing.totalRooms} rooms available`}
      </p>

      {active ? (
        <div className="mt-5 space-y-3">
          {sent && <Notice>Request sent! The landlord will get back to you here and in your notifications.</Notice>}
          <div className="rounded-xl border border-line p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Your reservation</span>
              <StatusPill status={active.status} />
            </div>
            <p className="mt-2 text-muted">
              {active.roomType} · move-in {active.moveIn ? formatDate(active.moveIn) : 'to be arranged'}
            </p>
          </div>
          <Link to="/boarder/reservations" className="btn-primary w-full">
            View my reservations
          </Link>
          {active.status === 'Pending' && (
            <button
              type="button"
              onClick={() => {
                setReservationStatus(active.id, 'Cancelled')
                setSent(false)
              }}
              className="btn w-full border border-line text-red-600 hover:bg-red-50"
            >
              Cancel request
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div className="rounded-lg bg-page px-3.5 py-2.5 text-sm">
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
          <button type="submit" className="btn-primary h-11 w-full" disabled={isFull}>
            <CalendarCheck className="size-4" aria-hidden="true" />
            {isFull ? 'Fully booked' : 'Request reservation'}
          </button>
          <p className="text-center text-xs text-muted">You won’t be charged. The landlord confirms availability first.</p>
        </form>
      )}
    </div>
  )
}

export default function RoomDetails() {
  const { listingId } = useParams()
  const { publicListings, favorites, toggleFavorite, recordView, ownerOf } = useData()
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
          <Link to="/boarder/browse" className="btn-primary">
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
      <Link to="/boarder/browse" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to browse
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Gallery listing={listing} />

          <section className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{listing.name}</h1>
                  <Tag>{availabilityOf(listing)}</Tag>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="size-4 shrink-0" aria-hidden="true" />
                  {listing.address ? `${listing.address}, ` : ''}
                  {listing.area}, {listing.city}
                </p>
              </div>
              <FavoriteButton listing={listing} isFavorite={favorites.includes(listing.id)} onToggle={toggleFavorite} className="size-10 shrink-0 border border-line shadow-none" />
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl bg-page p-3">
                  <Icon className="size-4 text-accent" aria-hidden="true" />
                  <dt className="mt-2 text-xs text-muted">{label}</dt>
                  <dd className="text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-6 font-semibold">About this place</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{listing.description || 'No description yet.'}</p>

            <h2 className="mt-6 font-semibold">Amenities</h2>
            <FeatureList features={listing.amenities} className="mt-3 text-sm [&_svg]:size-4" />
          </section>

          <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-accent-soft font-semibold text-accent">
                {owner.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <div>
                <p className="text-xs text-muted">Landlord</p>
                <p className="font-semibold">{owner.name}</p>
              </div>
            </div>
            {owner.phone && (
              <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="btn border border-line hover:bg-page">
                <Phone className="size-4" aria-hidden="true" />
                {owner.phone}
              </a>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ReservePanel listing={listing} />
        </aside>
      </div>
    </div>
  )
}
