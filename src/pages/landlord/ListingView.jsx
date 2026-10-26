import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, CircleAlert, Clock, DoorOpen, ExternalLink, House, MapPin, SearchX, SquarePen, Users } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatPeso } from '../../data/mockData'
import LivingHere from '../../components/listings/LivingHere'
import ListingStatus from '../../components/listings/ListingStatus'
import PhotoGallery from '../../components/listings/PhotoGallery'
import { FeatureList } from '../../components/listings/RoomCard'
import ReservationDialog from '../../components/reservations/ReservationDialog'
import ReviewsSection from '../../components/reviews/ReviewsSection'
import ReservationsTable from '../../components/reservations/ReservationsTable'
import { EmptyState, Notice, SectionHeader } from '../../components/ui'

export default function ListingView() {
  const { listingId } = useParams()
  const { state } = useLocation()
  const { myListings, incomingReservations, setReservationStatus } = useData()
  const [selectedId, setSelectedId] = useState(null)
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
            <ListingStatus listing={listing} />
          </div>
          <p className="d-flex align-items-center gap-1 small text-body-secondary mt-1 mb-0">
            <MapPin size={16} className="flex-shrink-0" aria-hidden="true" />
            {listing.address ? `${listing.address}, ` : ''}
            {listing.area}, {listing.city}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-self-start align-self-sm-auto">
          {listing.approval === 'Approved' && !listing.removed && (
            <Link to={`/rooms/${listing.id}`} className="btn btn-outline-secondary" target="_blank" rel="noopener">
              <ExternalLink size={16} aria-hidden="true" />
              See it as boarders do
            </Link>
          )}
          <Link to={`/landlord/listings/${listing.id}/edit`} className="btn btn-primary">
            <SquarePen size={16} aria-hidden="true" />
            {listing.approval === 'Rejected' && !listing.removed ? 'Edit and resubmit' : 'Edit listing'}
          </Link>
        </div>
      </div>

      {state?.saved && <Notice>{state.saved === 'created' ? 'Listing submitted! It’s now waiting for admin review.' : 'Changes saved.'}</Notice>}

      {listing.removed ? (
        <div className="alert alert-dark d-flex gap-2 small mb-0">
          <CircleAlert size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
          <p className="mb-0">
            <strong>Removed by an administrator</strong>
            {listing.removedReason ? `: ${listing.removedReason}` : '.'} Boarders can’t see it. If you think this is a mistake, <Link to="/contact">contact the RoomEase team</Link>.
          </p>
        </div>
      ) : listing.approval === 'Rejected' ? (
        <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 small mb-0">
          <p className="d-flex gap-2 mb-0">
            <CircleAlert size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
            <span>
              <strong>Needs changes:</strong> {listing.rejectionReason || 'An admin asked for changes.'} Fix it and save, and it goes back for review.
            </span>
          </p>
          <Link to={`/landlord/listings/${listing.id}/edit`} className="btn btn-sm btn-danger flex-shrink-0">
            Fix and resubmit
          </Link>
        </div>
      ) : listing.approval === 'Pending' ? (
        <div className="alert alert-warning d-flex gap-2 small mb-0">
          <Clock size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
          <p className="mb-0">
            <strong>In review.</strong> An admin checks every new listing, usually within a few days. Boarders can’t see it until it’s approved.
            <span className="d-block text-body-secondary mt-1">Admins review listings in the RoomEase admin panel. This demo version keeps its data in the browser, so it isn’t connected to the admin panel yet.</span>
          </p>
        </div>
      ) : null}

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

      <LivingHere listing={listing} title="Stay terms" />

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
          onDecide={(status, note) => {
            setReservationStatus(selected.id, status, note)
            setSelectedId(null)
          }}
        />
      )}
    </div>
  )
}
