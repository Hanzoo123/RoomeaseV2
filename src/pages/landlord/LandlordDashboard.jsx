import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CalendarDays, Clock, DoorOpen, Eye, House, Plus, ShieldCheck, SquarePen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { formatDate, formatPeso } from '../../data/mockData'
import HouseArt from '../../components/illustrations/HouseArt'
import { ListingImage, Modal, SectionHeader, StatCard, StatusPill, Tag, WelcomeBanner } from '../../components/ui'

function ListingRow({ listing }) {
  return (
    <article className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
      <div className="aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl sm:w-40">
        <ListingImage listing={listing} kind="house" className="size-full" />
      </div>
      <div className="min-w-0 flex-1 px-1 sm:px-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{listing.name}</h3>
          <Tag tone="approval">{listing.approval}</Tag>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {listing.area}, {listing.city}
        </p>
        <p className="mt-1.5 text-sm text-muted">
          <span className="text-base font-bold text-ink">{formatPeso(listing.price)}</span> / month
        </p>
        <span className="mt-2 inline-block rounded-md border border-line bg-page px-2 py-1 text-xs text-muted">
          Available: {listing.availableRooms} of {listing.totalRooms} rooms
        </span>
      </div>
      <div className="flex gap-5 self-end px-1 pb-1 text-sm font-medium sm:px-2">
        <Link to={`/landlord/listings?edit=${listing.id}`} className="inline-flex items-center gap-1.5 hover:text-accent">
          <SquarePen className="size-4" aria-hidden="true" />
          Edit
        </Link>
        <Link to={`/landlord/listings?view=${listing.id}`} className="inline-flex items-center gap-1.5 hover:text-accent">
          <Eye className="size-4" aria-hidden="true" />
          View
        </Link>
      </div>
    </article>
  )
}

function ReservationDialog({ reservation, listingName, onClose, onDecide }) {
  const isPending = reservation.status === 'Pending'
  const details = [
    ['Boarder', reservation.boarder],
    ['Property', listingName],
    ['Room type', reservation.roomType],
    ['Requested on', formatDate(reservation.date)],
  ]

  return (
    <Modal
      title="Reservation request"
      onClose={onClose}
      footer={
        isPending ? (
          <>
            <button type="button" onClick={() => onDecide('Declined')} className="btn border border-red-200 text-red-600 hover:bg-red-50">
              Decline
            </button>
            <button type="button" onClick={() => onDecide('Approved')} className="btn-primary">
              Approve
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className="btn border border-line hover:bg-page">
            Close
          </button>
        )
      }
    >
      <dl className="space-y-3 text-sm">
        {details.map(([term, value]) => (
          <div key={term} className="flex justify-between gap-4">
            <dt className="text-muted">{term}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Status</dt>
          <dd>
            <StatusPill status={reservation.status} />
          </dd>
        </div>
      </dl>
    </Modal>
  )
}

export default function LandlordDashboard() {
  const { user } = useAuth()
  const { listings, reservations, setReservationStatus, counts } = useData()
  const [selectedId, setSelectedId] = useState(null)

  const listingName = (id) => listings.find((listing) => listing.id === id)?.name ?? 'Unknown property'
  const availableSlots = listings.reduce((total, listing) => total + listing.availableSlots, 0)
  const recent = reservations.slice(0, 4)
  const selected = reservations.find((reservation) => reservation.id === selectedId)

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
        <StatCard icon={Building2} value={listings.length} label="My Listings" iconClassName="text-blue-600" />
        <StatCard icon={DoorOpen} value={availableSlots} label="Available Slots" iconClassName="text-green-600" />
        <StatCard icon={Clock} value={counts.landlord.pendingReservations} label="Pending Approval" iconClassName="text-amber-500" />
        <StatCard icon={CalendarDays} value={reservations.length} label="Reservation Requests" iconClassName="text-violet-600" />
      </div>

      <section>
        <SectionHeader title="My Boarding Houses" actionTo="/landlord/listings" />
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Recent Reservation Requests" actionTo="/landlord/reservations" />
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-line bg-page/70 text-xs font-semibold">
                <tr>
                  {['Date', 'Boarder', 'Property', 'Room Type', 'Status', 'Action'].map((heading) => (
                    <th key={heading} scope="col" className="px-5 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-page/50">
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted">{formatDate(reservation.date)}</td>
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap">{reservation.boarder}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted">{listingName(reservation.listingId)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted">{reservation.roomType}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={reservation.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedId(reservation.id)}
                        aria-label={`View request from ${reservation.boarder}`}
                        className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
