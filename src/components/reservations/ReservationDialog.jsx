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
            <button type="button" onClick={() => onDecide('Declined')} className="btn btn-outline-danger">
              Decline
            </button>
            <button type="button" onClick={() => onDecide('Approved')} className="btn btn-primary">
              Approve
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className="btn btn-outline-secondary">
            Close
          </button>
        )
      }
    >
      <dl className="small mb-0">
        {details.map(([term, value]) => (
          <div key={term} className="d-flex justify-content-between gap-3 mb-2">
            <dt className="fw-normal text-body-secondary">{term}</dt>
            <dd className="fw-medium text-end mb-0">{value}</dd>
          </div>
        ))}
        <div className="d-flex align-items-center justify-content-between gap-3">
          <dt className="fw-normal text-body-secondary">Status</dt>
          <dd className="mb-0">
            <StatusPill status={reservation.status} />
          </dd>
        </div>
      </dl>
      {reservation.message && <blockquote className="small bg-page rounded-3 px-3 py-2 mt-3 mb-0">“{reservation.message}”</blockquote>}
    </Modal>
  )
}
