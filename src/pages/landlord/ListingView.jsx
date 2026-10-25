import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, DoorOpen, House, MapPin, SearchX, SquarePen, Users } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatPeso } from '../../data/mockData'
import { FeatureList } from '../../components/listings/RoomCard'
import ReservationDialog from '../../components/reservations/ReservationDialog'
import ReservationsTable from '../../components/reservations/ReservationsTable'
import { EmptyState, ListingImage, Notice, SectionHeader, Tag } from '../../components/ui'

export default function ListingView() {
  const { listingId } = useParams()
  const { state } = useLocation()
  const { myListings, incomingReservations, setReservationStatus, updateListing } = useData()
  const [selectedId, setSelectedId] = useState(null)
  const listing = myListings.find((item) => item.id === listingId)

  if (!listing) {
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

  const reservations = incomingReservations.filter((item) => item.listingId === listing.id)
  const selected = reservations.find((item) => item.id === selectedId)
  const facts = [
    { icon: House, label: 'Room type', value: listing.roomType },
    { icon: DoorOpen, label: 'Rooms available', value: `${listing.availableRooms} of ${listing.totalRooms}` },
    { icon: Users, label: 'Open slots', value: listing.availableSlots },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/landlord/listings" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            My Boarding Houses
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{listing.name}</h1>
            <Tag tone="approval">{listing.approval}</Tag>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {listing.address ? `${listing.address}, ` : ''}
            {listing.area}, {listing.city}
          </p>
        </div>
        <Link to={`/landlord/listings/${listing.id}/edit`} className="btn-primary self-start sm:self-auto">
          <SquarePen className="size-4" aria-hidden="true" />
          Edit listing
        </Link>
      </div>

      {state?.saved && <Notice>{state.saved === 'created' ? 'Listing submitted! It’s now waiting for admin review.' : 'Changes saved.'}</Notice>}

      {listing.approval === 'Pending' && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-amber-900">
            <strong>Waiting for admin review.</strong> Boarders can’t see this listing until it’s approved.
          </p>
          <button
            type="button"
            onClick={() => updateListing(listing.id, { approval: 'Approved' })}
            className="btn shrink-0 border border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            title="There is no admin panel yet, so this simulates the approval."
          >
            Approve now (demo)
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="aspect-[16/10] overflow-hidden rounded-2xl">
          <ListingImage listing={listing} kind="house" className="size-full" />
        </div>
        <section className="card p-5 sm:p-6">
          <p className="text-sm text-muted">
            <span className="text-2xl font-bold text-ink">{formatPeso(listing.price)}</span> / month
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl bg-page p-3">
                <Icon className="size-4 text-accent" aria-hidden="true" />
                <dt className="mt-2 text-xs text-muted">{label}</dt>
                <dd className="text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-5 text-sm font-semibold">Amenities</h2>
          <FeatureList features={listing.amenities} className="mt-2" />
          <h2 className="mt-5 text-sm font-semibold">Description</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{listing.description || 'No description yet. Add one so boarders know what to expect.'}</p>
        </section>
      </div>

      <section>
        <SectionHeader title={`Reservation requests (${reservations.length})`} actionTo="/landlord/reservations" />
        {reservations.length > 0 ? (
          <ReservationsTable reservations={reservations} listingName={() => listing.name} onView={setSelectedId} />
        ) : (
          <EmptyState icon={Users} title="No requests for this listing yet" body="You’ll be notified when a boarder sends one." />
        )}
      </section>

      {selected && (
        <ReservationDialog
          reservation={selected}
          listingName={listing.name}
          onClose={() => setSelectedId(null)}
          onDecide={(status) => {
            setReservationStatus(selected.id, status)
            setSelectedId(null)
          }}
        />
      )}
    </div>
  )
}
