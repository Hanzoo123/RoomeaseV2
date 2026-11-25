import { Link } from 'react-router-dom'
import { CalendarDays, Minus, Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { availabilityOf, formatPeso } from '../../data/mockData'
import { freeSlotsOf } from '../../data/rooms'
import { ListingsError } from '../../components/listings/ListingsStatus'
import { EmptyState, ListingImage, PageHeader, Tag } from '../../components/ui'
import { PageSkeleton } from '../../components/ui/feedback'

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div className="input-group input-group-sm" style={{ width: '7.5rem' }}>
      <button type="button" className="btn btn-outline-secondary px-2" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
        <Minus size={16} />
      </button>
      <span className="input-group-text bg-body justify-content-center fw-semibold flex-grow-1" aria-live="polite" aria-label={`${label}: ${value}`}>
        {value}
      </span>
      <button type="button" className="btn btn-outline-secondary px-2" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label}`}>
        <Plus size={16} />
      </button>
    </div>
  )
}

function RoomRow({ listing, room, onChange }) {
  const free = freeSlotsOf(room)
  const switchId = `open-${listing.id}-${room.id}`
  return (
    <li className="d-flex flex-wrap align-items-center gap-3 py-3 border-top">
      <div className="flex-grow-1" style={{ minWidth: '10rem' }}>
        <p className="small fw-semibold mb-0">{room.name}</p>
        <p className="text-xs text-body-secondary mb-0">
          {room.type} · {formatPeso(room.rent)} / month · {room.capacity} {room.capacity === 1 ? 'bed' : 'beds'}
        </p>
      </div>
      <div>
        <p className="text-xs text-body-secondary mb-1">Beds taken</p>
        <Stepper label={`beds taken in ${room.name}`} value={room.slotsTaken} min={0} max={room.capacity} onChange={(slotsTaken) => onChange({ slotsTaken })} />
      </div>
      <div style={{ minWidth: '9.5rem' }}>
        <div className="form-check form-switch text-nowrap mb-1">
          <input id={switchId} type="checkbox" role="switch" className="form-check-input" checked={room.isOpen} onChange={(event) => onChange({ isOpen: event.target.checked })} />
          <label htmlFor={switchId} className="form-check-label small">
            Taking boarders
          </label>
        </div>
        {free > 0 ? (
          <span className="badge bg-success-subtle text-success-emphasis">
            {free} free {free === 1 ? 'bed' : 'beds'}
          </span>
        ) : (
          <span className="badge bg-secondary-subtle text-secondary-emphasis">{room.isOpen ? 'Full' : 'Closed'}</span>
        )}
      </div>
    </li>
  )
}

export default function RoomAvailability() {
  const { myListings, myListingsReady, myListingsError, reloadMyListings, updateRoom } = useData()
  const toast = useToast()
  // A removed listing's rooms can't change.
  const listings = myListings.filter((listing) => !listing.removed)
  const totals = listings.reduce(
    (sum, listing) => ({ rooms: sum.rooms + listing.totalRooms, available: sum.available + listing.availableRooms, slots: sum.slots + listing.availableSlots }),
    { rooms: 0, available: 0, slots: 0 },
  )

  async function change(listing, room, changes) {
    const result = await updateRoom(listing, room.id, changes)
    if (!result.ok) toast(result.error, 'error')
  }

  if (!myListingsReady) return <PageSkeleton />

  return (
    <div>
      <PageHeader title="Room Availability" subtitle="Update each room as boarders move in or out. Changes save automatically and show on your listing right away." />

      {myListingsError ? (
        <ListingsError error={myListingsError} onRetry={reloadMyListings} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No listings to manage"
          body="Add a boarding house first."
          action={
            <Link to="/landlord/add-listing" className="btn btn-primary">
              Add New Listing
            </Link>
          }
        />
      ) : (
        <>
          <div className="row g-3 mb-4">
            {[
              ['Total rooms', totals.rooms],
              ['Rooms with a free bed', totals.available],
              ['Free beds', totals.slots],
            ].map(([label, value]) => (
              <div key={label} className="col-4">
                <div className="card h-100">
                  <div className="card-body">
                    <p className="fs-3 fw-bold mb-0">{value}</p>
                    <p className="small text-body-secondary mb-0">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex flex-column gap-3">
            {listings.map((listing) => {
              const beds = listing.rooms.reduce((sum, room) => sum + room.capacity, 0)
              const taken = listing.rooms.reduce((sum, room) => sum + Math.min(room.slotsTaken, room.capacity), 0)
              const percent = beds ? Math.round((taken / beds) * 100) : 0
              return (
                <article key={listing.id} className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3">
                      <div className="thumb-square">
                        <ListingImage listing={listing} kind="house" />
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <Link to={`/landlord/listings/${listing.id}`} className="fw-semibold text-reset-link text-truncate">
                            {listing.name}
                          </Link>
                          <Tag>{availabilityOf(listing)}</Tag>
                        </div>
                        <div className="progress mt-2" role="progressbar" aria-label={`${percent}% of beds taken`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                          <div className="progress-bar" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="text-xs text-body-secondary mt-1 mb-0">
                          {taken} of {beds} beds taken · {listing.availableRooms} of {listing.totalRooms} rooms with a free bed
                        </p>
                      </div>
                    </div>
                    <ul className="list-unstyled mt-3 mb-0">
                      {listing.rooms.map((room) => (
                        <RoomRow key={room.id} listing={listing} room={room} onChange={(changes) => change(listing, room, changes)} />
                      ))}
                    </ul>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
