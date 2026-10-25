import { Link } from 'react-router-dom'
import { CalendarDays, Minus, Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { availabilityOf } from '../../data/mockData'
import { EmptyState, ListingImage, PageHeader, Tag } from '../../components/ui'

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div>
      <p className="text-xs text-body-secondary mb-1">{label}</p>
      <div className="input-group input-group-sm" style={{ width: '7.5rem' }}>
        <button type="button" className="btn btn-outline-secondary px-2" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
          <Minus size={16} />
        </button>
        <span className="input-group-text bg-body justify-content-center fw-semibold flex-grow-1" aria-live="polite">
          {value}
        </span>
        <button type="button" className="btn btn-outline-secondary px-2" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

export default function RoomAvailability() {
  const { myListings, updateListing } = useData()
  const totals = myListings.reduce(
    (sum, listing) => ({ rooms: sum.rooms + listing.totalRooms, available: sum.available + listing.availableRooms, slots: sum.slots + listing.availableSlots }),
    { rooms: 0, available: 0, slots: 0 },
  )

  return (
    <div>
      <PageHeader title="Room Availability" subtitle="Update open rooms and beds as boarders move in or out. Changes save automatically." />

      {myListings.length === 0 ? (
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
              ['Rooms available', totals.available],
              ['Open slots', totals.slots],
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
            {myListings.map((listing) => {
              const occupied = listing.totalRooms - listing.availableRooms
              const percent = Math.round((occupied / listing.totalRooms) * 100)
              return (
                <article key={listing.id} className="card">
                  <div className="card-body d-flex flex-column flex-md-row align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
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
                        <div className="progress mt-2" role="progressbar" aria-label={`${percent}% of rooms occupied`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                          <div className="progress-bar" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="text-xs text-body-secondary mt-1 mb-0">
                          {occupied} of {listing.totalRooms} rooms occupied · {listing.roomType}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex gap-3">
                      <Stepper
                        label="Rooms available"
                        value={listing.availableRooms}
                        min={0}
                        max={listing.totalRooms}
                        onChange={(availableRooms) => updateListing(listing.id, { availableRooms, availableSlots: Math.max(listing.availableSlots, availableRooms) })}
                      />
                      <Stepper label="Open slots" value={listing.availableSlots} min={listing.availableRooms} max={99} onChange={(availableSlots) => updateListing(listing.id, { availableSlots })} />
                    </div>
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
