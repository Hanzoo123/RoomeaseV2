import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, DoorOpen, House, MapPin, SearchX, SquarePen, Users } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatPeso } from '../../data/mockData'
import PhotoGallery from '../../components/listings/PhotoGallery'
import { FeatureList } from '../../components/listings/RoomCard'
import ReservationDialog from '../../components/reservations/ReservationDialog'
import ReviewsSection from '../../components/reviews/ReviewsSection'
import ReservationsTable from '../../components/reservations/ReservationsTable'
import { EmptyState, Notice, SectionHeader, Tag } from '../../components/ui'

export default function ListingView() {
  const { listingId } = useParams()
  const { state } = useLocation()
  const { myListings, incomingReservations, setReservationStatus, updateListing } = useData()
  const [selectedId, setSelectedId] = useState(null)
  const toast = useToast()
  const listing = myListings.find((item) => item.id === listingId)

  if (!listing) {
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

  const reservations = incomingReservations.filter((item) => item.listingId === listing.id)
  const selected = reservations.find((item) => item.id === selectedId)
  const facts = [
    { icon: House, label: 'Room type', value: listing.roomType },
    { icon: DoorOpen, label: 'Rooms available', value: `${listing.availableRooms} of ${listing.totalRooms}` },
    { icon: Users, label: 'Open slots', value: listing.availableSlots },
  ]

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-end justify-content-between gap-3">
        <div>
          <Link to="/landlord/listings" className="d-inline-flex align-items-center gap-1 small fw-medium link-secondary text-decoration-none mb-2">
            <ArrowLeft size={16} aria-hidden="true" />
            My Boarding Houses
          </Link>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <h1 className="h4 fw-bold tracking-tight mb-0">{listing.name}</h1>
            <Tag tone="approval">{listing.approval}</Tag>
          </div>
          <p className="d-flex align-items-center gap-1 small text-body-secondary mt-1 mb-0">
            <MapPin size={16} className="flex-shrink-0" aria-hidden="true" />
            {listing.address ? `${listing.address}, ` : ''}
            {listing.area}, {listing.city}
          </p>
        </div>
        <Link to={`/landlord/listings/${listing.id}/edit`} className="btn btn-primary align-self-start align-self-sm-auto">
          <SquarePen size={16} aria-hidden="true" />
          Edit listing
        </Link>
      </div>

      {state?.saved && <Notice>{state.saved === 'created' ? 'Listing submitted! It’s now waiting for admin review.' : 'Changes saved.'}</Notice>}

      {listing.approval === 'Pending' && (
        <div className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 small mb-0">
          <p className="mb-0">
            <strong>Waiting for admin review.</strong> Boarders can’t see this listing until it’s approved.
          </p>
          <button
            type="button"
            onClick={() => {
              updateListing(listing.id, { approval: 'Approved' })
              toast('Listing approved. Boarders can see it now.')
            }}
            className="btn btn-sm btn-light border flex-shrink-0"
            title="There is no admin panel yet, so this simulates the approval."
          >
            Approve now (demo)
          </button>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-6">
          <PhotoGallery listing={listing} />
        </div>
        <div className="col-lg-6">
          <section className="card h-100">
            <div className="card-body p-4">
              <p className="small text-body-secondary mb-0">
                <span className="fs-3 fw-bold text-body">{formatPeso(listing.price)}</span> / month
              </p>
              <dl className="row g-3 mt-1 mb-0">
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
              <h2 className="small fw-semibold mt-4 mb-2">Amenities</h2>
              <FeatureList features={listing.amenities} />
              <h2 className="small fw-semibold mt-4 mb-1">Description</h2>
              <p className="small mb-0" style={{ lineHeight: 1.7 }}>
                {listing.description || 'No description yet. Add one so boarders know what to expect.'}
              </p>
            </div>
          </section>
        </div>
      </div>

      <ReviewsSection listing={listing} landlordMode />

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
