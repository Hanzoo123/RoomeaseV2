import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CalendarDays, Clock, DoorOpen, House, Plus, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import HouseArt from '../../components/illustrations/HouseArt'
import ListingRow from '../../components/listings/ListingRow'
import ReservationDialog from '../../components/reservations/ReservationDialog'
import ReservationsTable from '../../components/reservations/ReservationsTable'
import { EmptyState, SectionHeader, StatCard, WelcomeBanner } from '../../components/ui'

const DashboardInsights = lazy(() => import('./DashboardInsights'))

function InsightsPlaceholder() {
  return (
    <div className="placeholder-glow" aria-busy="true" aria-label="Loading insights">
      <span className="placeholder col-12 rounded-4" style={{ height: '20rem' }} />
    </div>
  )
}

export default function LandlordDashboard() {
  const { user } = useAuth()
  const { myListings, incomingReservations, setReservationStatus, listingById, counts } = useData()
  const [selectedId, setSelectedId] = useState(null)

  const listingName = (id) => listingById(id)?.name ?? 'Removed listing'
  const availableSlots = myListings.reduce((total, listing) => total + listing.availableSlots, 0)
  const selected = incomingReservations.find((reservation) => reservation.id === selectedId)

  return (
    <div className="d-flex flex-column gap-4">
      <WelcomeBanner title={`Welcome back, ${user.firstName}!`} subtitle="Manage your boarding house listings and room availability." art={<HouseArt variant={0} />} />

      <section className="cta-accent rounded-4 text-white d-flex flex-column flex-sm-row align-items-sm-center gap-3 p-4">
        <span className="icon-circle icon-circle-lg bg-white text-primary">
          <House size={24} aria-hidden="true" />
        </span>
        <div className="flex-grow-1">
          <h2 className="h5 fw-semibold mb-1">Add a Boarding House</h2>
          <p className="small text-white text-opacity-75 mb-0">Create a listing for boarders to discover.</p>
        </div>
        <Link to="/landlord/add-listing" className="btn btn-light text-primary">
          <Plus size={16} aria-hidden="true" />
          Add New Listing
        </Link>
      </section>

      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <StatCard icon={Building2} value={myListings.length} label="My Listings" iconClassName="text-primary-emphasis" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon={DoorOpen} value={availableSlots} label="Available Slots" iconClassName="text-success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon={Clock} value={counts.pendingReservations} label="Pending Approval" iconClassName="text-warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon={CalendarDays} value={incomingReservations.length} label="Reservation Requests" iconClassName="text-info" />
        </div>
      </div>

      <Suspense fallback={<InsightsPlaceholder />}>
        <DashboardInsights />
      </Suspense>

      <section>
        <SectionHeader title="My Boarding Houses" actionTo="/landlord/listings" />
        {myListings.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {myListings.slice(0, 3).map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="No listings yet"
            body="Add your first boarding house so boarders can find it."
            action={
              <Link to="/landlord/add-listing" className="btn btn-primary">
                Add New Listing
              </Link>
            }
          />
        )}
      </section>

      <section>
        <SectionHeader title="Recent Reservation Requests" actionTo="/landlord/reservations" />
        {incomingReservations.length > 0 ? (
          <ReservationsTable reservations={incomingReservations.slice(0, 4)} listingName={listingName} onView={setSelectedId} />
        ) : (
          <EmptyState icon={CalendarDays} title="No reservation requests yet" body="Requests from boarders will show up here." />
        )}
      </section>

      <section className="alert alert-success rounded-4 d-flex flex-column flex-sm-row align-items-sm-center gap-3 p-4 mb-0">
        <ShieldCheck size={48} className="flex-shrink-0 text-primary" fill="currentColor" color="white" strokeWidth={1.6} aria-hidden="true" />
        <div className="flex-grow-1">
          <h2 className="fs-6 fw-semibold text-body mb-1">Listing Approval Status</h2>
          <p className="small text-body-secondary mb-0">Your listings are reviewed by our admin team to ensure quality and safety for all boarders.</p>
        </div>
        <Link to="/landlord/listings" className="btn btn-primary align-self-start align-self-sm-auto">
          Learn More
        </Link>
      </section>

      {selected && (
        <ReservationDialog
          reservation={selected}
          listingName={listingName(selected.listingId)}
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
