import { formatDate } from '../../data/mockData'
import { Modal, StatusPill } from '../ui'

// Landlord view of one request, with approve / decline while it is pending.
export default function ReservationDialog({ reservation, listingName, onClose, onDecide }) {
  const isPending = reservation.status === 'Pending'
  const details = [
    ['Boarder', reservation.boarder],
    ['Property', listingName],
    ['Room type', reservation.roomType],
    ['Requested on', formatDate(reservation.date)],
    ...(reservation.moveIn ? [['Move-in date', formatDate(reservation.moveIn)]] : []),
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
      {reservation.message && (
        <blockquote className="mt-4 rounded-lg bg-page px-3.5 py-3 text-sm text-ink/80">“{reservation.message}”</blockquote>
      )}
    </Modal>
  )
}
