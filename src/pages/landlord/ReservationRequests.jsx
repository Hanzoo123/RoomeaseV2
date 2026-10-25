import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useData } from '../../context/DataContext'
import ReservationDialog from '../../components/reservations/ReservationDialog'
import ReservationsTable from '../../components/reservations/ReservationsTable'
import { EmptyState, PageHeader, Tabs } from '../../components/ui'

const STATUSES = ['Pending', 'Approved', 'Declined', 'Cancelled']

export default function ReservationRequests() {
  const { myListings, incomingReservations, listingById, setReservationStatus } = useData()
  const [tab, setTab] = useState('Pending')
  const [listingFilter, setListingFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const byListing = listingFilter ? incomingReservations.filter((item) => item.listingId === listingFilter) : incomingReservations
  const tabs = [
    ...STATUSES.map((status) => ({ value: status, label: status, count: byListing.filter((item) => item.status === status).length })),
    { value: 'All', label: 'All', count: byListing.length },
  ]
  const visible = tab === 'All' ? byListing : byListing.filter((item) => item.status === tab)
  const selected = incomingReservations.find((item) => item.id === selectedId)
  const listingName = (id) => listingById(id)?.name ?? 'Removed listing'

  return (
    <div>
      <PageHeader title="Reservation Requests" subtitle="Review boarders’ requests and approve or decline them." />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs tabs={tabs} value={tab} onChange={setTab} label="Filter requests by status" />
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Property</span>
          <select
            value={listingFilter}
            onChange={(event) => setListingFilter(event.target.value)}
            className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-medium focus:border-accent focus:outline-none"
          >
            <option value="">All properties</option>
            {myListings.map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5">
        {visible.length > 0 ? (
          <ReservationsTable reservations={visible} listingName={listingName} onView={setSelectedId} />
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={tab === 'All' ? 'No reservation requests yet' : `No ${tab.toLowerCase()} requests`}
            body={tab === 'Pending' ? 'You’re all caught up.' : 'Requests from boarders will show up here.'}
          />
        )}
      </div>

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
