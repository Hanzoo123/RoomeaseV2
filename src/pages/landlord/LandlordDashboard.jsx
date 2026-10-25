import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CalendarDays, Clock, DoorOpen, House, Plus, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import HouseArt from '../../components/illustrations/HouseArt'
import ListingRow from '../../components/listings/ListingRow'
import ReservationDialog from '../../components/reservations/ReservationDialog'
import ReservationsTable from '../../components/reservations/ReservationsTable'
import { EmptyState, SectionHeader, StatCard, WelcomeBanner } from '../../components/ui'

export default function LandlordDashboard() {
  const { user } = useAuth()
  const { myListings, incomingReservations, setReservationStatus, listingById, counts } = useData()
  const [selectedId, setSelectedId] = useState(null)

  const listingName = (id) => listingById(id)?.name ?? 'Removed listing'
  const availableSlots = myListings.reduce((total, listing) => total + listing.availableSlots, 0)
  const selected = incomingReservations.find((reservation) => reservation.id === selectedId)

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title={`Welcome back, ${user.firstName}!`}
        subtitle="Manage your boarding house listings and room availability."
        art={<HouseArt variant={0} className="size-full" />}
      />

      <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-accent to-[#1c8a4f] p-5 text-white shadow-[0_10px_30px_-12px_rgba(22,112,63,0.55)] sm:flex-row sm:items-center sm:p-6">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-accent">
          <House className="size-6" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Add a Boarding House</h2>
          <p className="text-sm text-white/80">Create a listing for boarders to discover.</p>
        </div>
        <Link to="/landlord/add-listing" className="btn bg-white text-accent hover:bg-white/90">
          <Plus className="size-4" aria-hidden="true" />
          Add New Listing
        </Link>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} value={myListings.length} label="My Listings" iconClassName="text-blue-600" />
        <StatCard icon={DoorOpen} value={availableSlots} label="Available Slots" iconClassName="text-green-600" />
        <StatCard icon={Clock} value={counts.pendingReservations} label="Pending Approval" iconClassName="text-amber-500" />
        <StatCard icon={CalendarDays} value={incomingReservations.length} label="Reservation Requests" iconClassName="text-violet-600" />
      </div>

      <section>
        <SectionHeader title="My Boarding Houses" actionTo="/landlord/listings" />
        {myListings.length > 0 ? (
          <div className="space-y-3">
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
              <Link to="/landlord/add-listing" className="btn-primary">
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

      <section className="flex flex-col gap-4 rounded-2xl border border-green-200 bg-green-50/80 p-5 sm:flex-row sm:items-center sm:p-6">
        <ShieldCheck className="size-12 shrink-0 fill-accent text-white" strokeWidth={1.6} aria-hidden="true" />
        <div className="flex-1">
          <h2 className="font-semibold">Listing Approval Status</h2>
          <p className="mt-0.5 text-sm text-muted">
            Your listings are reviewed by our admin team to ensure quality and safety for all boarders.
          </p>
        </div>
        <Link to="/landlord/listings" className="btn-primary self-start sm:self-auto">
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
