import { Link } from 'react-router-dom'
import { CalendarDays, Minus, Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { availabilityOf } from '../../data/mockData'
import { EmptyState, ListingImage, PageHeader, Tag } from '../../components/ui'

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      <div className="inline-flex items-center rounded-lg border border-line bg-white">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="grid size-9 place-items-center rounded-l-lg text-ink hover:bg-page disabled:text-muted/40 disabled:hover:bg-transparent"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="grid size-9 place-items-center rounded-r-lg text-ink hover:bg-page disabled:text-muted/40 disabled:hover:bg-transparent"
        >
          <Plus className="size-4" />
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
            <Link to="/landlord/add-listing" className="btn-primary">
              Add New Listing
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-3">
            {[
              ['Total rooms', totals.rooms],
              ['Rooms available', totals.available],
              ['Open slots', totals.slots],
            ].map(([label, value]) => (
              <div key={label} className="card p-4">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted sm:text-sm">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {myListings.map((listing) => {
              const occupied = listing.totalRooms - listing.availableRooms
              const percent = Math.round((occupied / listing.totalRooms) * 100)
              return (
                <article key={listing.id} className="card flex flex-col gap-4 p-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="aspect-square w-16 shrink-0 overflow-hidden rounded-lg">
                      <ListingImage listing={listing} kind="house" className="size-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/landlord/listings/${listing.id}`} className="truncate font-semibold hover:text-accent">
                          {listing.name}
                        </Link>
                        <Tag>{availabilityOf(listing)}</Tag>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-page" role="img" aria-label={`${percent}% of rooms occupied`}>
                        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {occupied} of {listing.totalRooms} rooms occupied · {listing.roomType}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Stepper
                      label="Rooms available"
                      value={listing.availableRooms}
                      min={0}
                      max={listing.totalRooms}
                      onChange={(availableRooms) =>
                        updateListing(listing.id, { availableRooms, availableSlots: Math.max(listing.availableSlots, availableRooms) })
                      }
                    />
                    <Stepper
                      label="Open slots"
                      value={listing.availableSlots}
                      min={listing.availableRooms}
                      max={99}
                      onChange={(availableSlots) => updateListing(listing.id, { availableSlots })}
                    />
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
