import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CircleAlert, CircleCheck, ExternalLink, Mail, MapPin, Phone, SearchX } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { formatDate, formatDateTime, formatPeso } from '../../data/mockData'
import ActivityItem from '../../components/admin/ActivityItem'
import { ModerationButtons, useModeration } from '../../components/admin/Moderation'
import LivingHere from '../../components/listings/LivingHere'
import ListingStatus from '../../components/listings/ListingStatus'
import PhotoGallery from '../../components/listings/PhotoGallery'
import { FeatureList } from '../../components/listings/RoomCard'
import MapView from '../../components/map/MapView'
import { EmptyState } from '../../components/ui'

// Rents outside this range are usually a typo (an extra zero, or the daily rate).
const RENT_RANGE = [500, 15000]

// What an admin checks before approving. Failed items are warnings, not blockers.
function checklistFor(listing) {
  return [
    // Just the barangay name (e.g. "Poblacion") isn't enough to find the house.
    { label: 'Full street address', ok: (listing.address ?? '').trim().length >= 8 && listing.address.trim().toLowerCase() !== listing.area.toLowerCase() },
    { label: 'At least one real photo', ok: listing.photos.length > 0, hint: 'Shows an illustration until the landlord uploads photos.' },
    { label: 'Description of 40+ characters', ok: (listing.description ?? '').trim().length >= 40 },
    { label: `Rent between ${formatPeso(RENT_RANGE[0])} and ${formatPeso(RENT_RANGE[1])}`, ok: listing.price >= RENT_RANGE[0] && listing.price <= RENT_RANGE[1] },
    { label: 'Open rooms not more than total rooms', ok: listing.availableRooms <= listing.totalRooms },
    { label: 'Bills included are listed', ok: listing.utilities.length > 0 },
    { label: 'House rules are listed', ok: listing.houseRules.length > 0 },
  ]
}

export default function ListingReview() {
  const { listingId } = useParams()
  const { findAccount } = useAuth()
  const { listings, activity, ownerOf } = useData()
  const [actions, dialog] = useModeration()
  const listing = listings.find((item) => item.id === listingId)
  const markers = useMemo(() => (listing ? [{ id: listing.id, coords: listing.coords, label: listing.name, active: true }] : []), [listing])

  if (!listing) {
    return (
      <EmptyState
        icon={SearchX}
        title="Listing not found"
        body="It may have been deleted by its landlord."
        action={
          <Link to="/admin/listings" className="btn btn-primary">
            Back to listings
          </Link>
        }
      />
    )
  }

  const owner = ownerOf(listing)
  const ownerAccount = findAccount(listing.ownerId)
  const ownerListings = listings.filter((item) => item.ownerId === listing.ownerId).length
  const checklist = checklistFor(listing)
  const passed = checklist.filter((item) => item.ok).length
  const history = activity.filter((entry) => entry.targetType === 'listing' && entry.targetId === listing.id)

  return (
    <div>
      <Link to="/admin/listings" className="d-inline-flex align-items-center gap-1 small fw-medium link-secondary text-decoration-none mb-3">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to listings
      </Link>

      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <h1 className="h4 fw-bold tracking-tight mb-0">{listing.name}</h1>
            <ListingStatus listing={listing} />
          </div>
          <p className="small text-body-secondary mb-0 mt-1">
            Submitted {listing.submittedAt ? formatDateTime(listing.submittedAt) : 'before reviews were tracked'}
            {listing.moderatedAt && ` · last reviewed ${formatDate(listing.moderatedAt)}`}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <ModerationButtons listing={listing} actions={actions} size="md" />
          {listing.approval === 'Approved' && !listing.removed && (
            <Link to={`/rooms/${listing.id}`} className="btn btn-outline-secondary" target="_blank" rel="noopener">
              <ExternalLink size={16} aria-hidden="true" />
              Public page
            </Link>
          )}
        </div>
      </div>

      {listing.approval === 'Rejected' && listing.rejectionReason && !listing.removed && (
        <div className="alert alert-danger small d-flex gap-2">
          <CircleAlert size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
          <span>
            <strong>Sent back to the landlord:</strong> {listing.rejectionReason}
          </span>
        </div>
      )}
      {listing.removed && (
        <div className="alert alert-dark small d-flex gap-2">
          <CircleAlert size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
          <span>
            <strong>Removed from the site</strong>
            {listing.removedReason ? `: ${listing.removedReason}` : '.'} Boarders can’t see it until it is restored.
          </span>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8 d-flex flex-column gap-4">
          <PhotoGallery listing={listing} />

          <section className="card">
            <div className="card-body p-4">
              <p className="d-flex align-items-center gap-1 small text-body-secondary mb-3">
                <MapPin size={16} aria-hidden="true" />
                {listing.address ? `${listing.address}, ` : <span className="text-danger me-1">No street address ·</span>}
                {listing.area}, {listing.city}
              </p>
              <dl className="row g-3 mb-0">
                {[
                  ['Monthly rent', formatPeso(listing.price)],
                  ['Room type', listing.roomType],
                  ['Rooms open', `${listing.availableRooms} of ${listing.totalRooms}`],
                  ['Open slots', listing.availableSlots],
                ].map(([label, value]) => (
                  <div key={label} className="col-6 col-md-3">
                    <div className="fact-tile h-100">
                      <dt className="text-xs fw-normal text-body-secondary">{label}</dt>
                      <dd className="small fw-semibold mb-0">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <h2 className="fs-6 fw-semibold mt-4 mb-2">Description</h2>
              <p className="small mb-0" style={{ lineHeight: 1.7 }}>
                {listing.description || <span className="text-body-secondary">No description.</span>}
              </p>
              <h2 className="fs-6 fw-semibold mt-4 mb-3">Amenities</h2>
              {listing.amenities.length ? <FeatureList features={listing.amenities} className="small" iconSize={16} /> : <p className="small text-body-secondary mb-0">None listed.</p>}
            </div>
          </section>

          <LivingHere listing={listing} title="Stay terms" />

          <section className="card">
            <div className="card-body p-4">
              <h2 className="h5 fw-semibold mb-3">Map pin</h2>
              <MapView markers={markers} style={{ height: '14rem' }} label={`Map pin for ${listing.name}`} />
            </div>
          </section>
        </div>

        <aside className="col-lg-4 d-flex flex-column gap-4">
          <section className="card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="h6 fw-semibold mb-0">Review checklist</h2>
                <span className={`badge rounded-pill ${passed === checklist.length ? 'text-bg-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                  {passed} of {checklist.length}
                </span>
              </div>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                {checklist.map(({ label, ok, hint }) => (
                  <li key={label} className="d-flex gap-2">
                    {ok ? (
                      <CircleCheck size={16} className="text-success flex-shrink-0 mt-1" aria-label="Done" />
                    ) : (
                      <CircleAlert size={16} className="text-warning flex-shrink-0 mt-1" aria-label="Missing" />
                    )}
                    <span>
                      {label}
                      {!ok && hint && <span className="d-block text-xs text-body-secondary">{hint}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="card">
            <div className="card-body p-4">
              <h2 className="h6 fw-semibold mb-3">Landlord</h2>
              <p className="fw-semibold mb-0">{owner.name}</p>
              <p className="text-xs text-body-secondary mb-3">
                {ownerListings} {ownerListings === 1 ? 'listing' : 'listings'}
                {ownerAccount?.createdAt && ` · joined ${formatDate(ownerAccount.createdAt)}`}
                {ownerAccount && !ownerAccount.active && ' · deactivated'}
              </p>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-3">
                {owner.email && (
                  <li className="d-flex align-items-center gap-2">
                    <Mail size={14} className="text-body-secondary" aria-hidden="true" />
                    <a href={`mailto:${owner.email}?subject=${encodeURIComponent(`Your RoomEase listing: ${listing.name}`)}`} className="text-decoration-none text-break">
                      {owner.email}
                    </a>
                  </li>
                )}
                {owner.phone && (
                  <li className="d-flex align-items-center gap-2">
                    <Phone size={14} className="text-body-secondary" aria-hidden="true" />
                    {owner.phone}
                  </li>
                )}
              </ul>
              <Link to={`/admin/users?q=${encodeURIComponent(owner.name)}`} className="btn btn-sm btn-outline-secondary">
                View account
              </Link>
            </div>
          </section>

          <section className="card">
            <div className="card-body p-4">
              <h2 className="h6 fw-semibold mb-1">History</h2>
              {history.length ? (
                <ul className="list-unstyled mb-0 activity-list">
                  {history.map((entry) => (
                    <ActivityItem key={entry.id} entry={entry} />
                  ))}
                </ul>
              ) : (
                <p className="small text-body-secondary mb-0 mt-2">No recorded changes yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
      {dialog}
    </div>
  )
}
