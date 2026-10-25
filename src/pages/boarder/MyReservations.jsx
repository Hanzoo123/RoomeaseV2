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

      <div className="d-flex flex-column gap-3 mt-4">
        {visible.length === 0 && (
          <EmptyState
            icon={CalendarX}
            title={tab === 'All' ? 'No reservations yet' : `No ${tab.toLowerCase()} reservations`}
            body="Find a room you like and send the landlord a reservation request."
            action={
              <Link to="/boarder/browse" className="btn btn-primary">
                Browse rooms
              </Link>
            }
          />
        )}

        {visible.map((reservation) => {
          const listing = listingById(reservation.listingId)
          const owner = listing && ownerOf(listing)
          return (
            <article key={reservation.id} className="card">
              <div className="card-body p-3 d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                <div className="thumb thumb-md bg-page">
                  <div className="ratio" style={{ '--bs-aspect-ratio': '62.5%' }}>
                    {listing ? <ListingImage listing={listing} kind="room" /> : <div />}
                  </div>
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    {listing ? (
                      <Link to={`/boarder/rooms/${listing.id}`} className="fw-semibold text-reset-link">
                        {listing.name}
                      </Link>
                    ) : (
                      <span className="fw-semibold text-body-secondary">Listing removed</span>
                    )}
                    <StatusPill status={reservation.status} />
                  </div>
                  <p className="small text-body-secondary mt-1 mb-1">
                    {reservation.roomType}
                    {listing && ` · ${formatPeso(listing.price)}/month`}
                  </p>
                  <p className="text-xs text-body-secondary mb-0">
                    Requested {formatDate(reservation.date)}
                    {reservation.moveIn && ` · Move-in ${formatDate(reservation.moveIn)}`}
                  </p>
                  {reservation.status === 'Approved' && owner?.phone && (
                    <p className="small mt-2 mb-0">
                      Contact <strong>{owner.name}</strong> to arrange your move-in.
                    </p>
                  )}
                </div>
                <div className="d-flex gap-2 align-self-end align-self-sm-center">
                  {reservation.status === 'Approved' && owner?.phone && (
                    <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="btn btn-outline-secondary">
                      <Phone size={16} aria-hidden="true" />
                      Call
                    </a>
                  )}
                  {reservation.status === 'Pending' && (
                    <button type="button" onClick={() => setCancelling(reservation)} className="btn btn-outline-danger">
                      Cancel
                    </button>
                  )}
                  {['Declined', 'Cancelled'].includes(reservation.status) && (
                    <Link to="/boarder/browse" className="btn btn-outline-secondary">
                      Find another room
                    </Link>
                  )}
                </div>
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
              <button type="button" onClick={() => setCancelling(null)} className="btn btn-outline-secondary">
                Keep request
              </button>
              <button
                type="button"
                onClick={() => {
                  setReservationStatus(cancelling.id, 'Cancelled')
                  setCancelling(null)
                }}
                className="btn btn-danger"
              >
                Cancel request
              </button>
            </>
          }
        >
          <p className="small text-body-secondary mb-0">
            The landlord of <strong className="text-body">{listingById(cancelling.listingId)?.name ?? 'this listing'}</strong> will be told you’re no longer interested.
          </p>
        </Modal>
      )}
    </div>
  )
}
