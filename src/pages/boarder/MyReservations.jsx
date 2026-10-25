import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarX, Phone } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatDate, formatPeso } from '../../data/mockData'
import { EmptyState, ListingImage, Modal, PageHeader, StatusPill, Tabs } from '../../components/ui'

const STATUSES = ['Pending', 'Approved', 'Declined', 'Cancelled']

export default function MyReservations() {
  const { myReservations, listingById, ownerOf, setReservationStatus } = useData()
  const [tab, setTab] = useState('All')
  const [cancelling, setCancelling] = useState(null)

  const tabs = [
    { value: 'All', label: 'All', count: myReservations.length },
    ...STATUSES.map((status) => ({ value: status, label: status, count: myReservations.filter((item) => item.status === status).length })),
  ]
  const visible = tab === 'All' ? myReservations : myReservations.filter((item) => item.status === tab)

  return (
    <div>
      <PageHeader title="My Reservations" subtitle="Track the rooms you’ve requested and the landlord’s response." />
      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Filter reservations by status" />

      <div className="mt-5 space-y-3">
        {visible.length === 0 && (
          <EmptyState
            icon={CalendarX}
            title={tab === 'All' ? 'No reservations yet' : `No ${tab.toLowerCase()} reservations`}
            body="Find a room you like and send the landlord a reservation request."
            action={
              <Link to="/boarder/browse" className="btn-primary">
                Browse rooms
              </Link>
            }
          />
        )}

        {visible.map((reservation) => {
          const listing = listingById(reservation.listingId)
          const owner = listing && ownerOf(listing)
          return (
            <article key={reservation.id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
              <div className="aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-page sm:w-36">
                {listing && <ListingImage listing={listing} kind="room" className="size-full" />}
              </div>
              <div className="min-w-0 flex-1 px-1 sm:px-0">
                <div className="flex flex-wrap items-center gap-2">
                  {listing ? (
                    <Link to={`/boarder/rooms/${listing.id}`} className="font-semibold hover:text-accent">
                      {listing.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-muted">Listing removed</span>
                  )}
                  <StatusPill status={reservation.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {reservation.roomType}
                  {listing && ` · ${formatPeso(listing.price)}/month`}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Requested {formatDate(reservation.date)}
                  {reservation.moveIn && ` · Move-in ${formatDate(reservation.moveIn)}`}
                </p>
                {reservation.status === 'Approved' && owner?.phone && (
                  <p className="mt-2 text-sm">
                    Contact <strong>{owner.name}</strong> to arrange your move-in.
                  </p>
                )}
              </div>
              <div className="flex gap-2 self-end px-1 pb-1 sm:self-center">
                {reservation.status === 'Approved' && owner?.phone && (
                  <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="btn border border-line hover:bg-page">
                    <Phone className="size-4" aria-hidden="true" />
                    Call
                  </a>
                )}
                {reservation.status === 'Pending' && (
                  <button type="button" onClick={() => setCancelling(reservation)} className="btn border border-line text-red-600 hover:bg-red-50">
                    Cancel
                  </button>
                )}
                {['Declined', 'Cancelled'].includes(reservation.status) && (
                  <Link to="/boarder/browse" className="btn border border-line hover:bg-page">
                    Find another room
                  </Link>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {cancelling && (
        <Modal
          title="Cancel this request?"
          onClose={() => setCancelling(null)}
          footer={
            <>
              <button type="button" onClick={() => setCancelling(null)} className="btn border border-line hover:bg-page">
                Keep request
              </button>
              <button
                type="button"
                onClick={() => {
                  setReservationStatus(cancelling.id, 'Cancelled')
                  setCancelling(null)
                }}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Cancel request
              </button>
            </>
          }
        >
          <p className="text-sm text-muted">
            The landlord of <strong className="text-ink">{listingById(cancelling.listingId)?.name ?? 'this listing'}</strong> will be told you’re no longer interested.
          </p>
        </Modal>
      )}
    </div>
  )
}
