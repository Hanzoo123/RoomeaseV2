import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../data/mockData'
import { Modal, StatusPill } from '../ui'

// Landlord view of one request, with approve / decline while it is pending.
export default function ReservationDialog({ reservation, listingName, onClose, onDecide }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { listingById, startConversation } = useData()
  const isPending = reservation.status === 'Pending'
  const listing = listingById(reservation.listingId)
  const toast = useToast()

  function decide(status) {
    onDecide(status)
    toast(status === 'Approved' ? `Approved ${reservation.boarder}’s request. They’ve been notified.` : `Declined ${reservation.boarder}’s request.`, status === 'Approved' ? 'success' : 'info')
  }

  function messageBoarder() {
    const id = startConversation({ listing, boarderId: reservation.boarderId, boarderName: reservation.boarder, landlordName: user.name })
    navigate(`/landlord/messages/${id}`)
  }
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
            {listing && (
              <button type="button" onClick={messageBoarder} className="btn btn-outline-secondary me-auto">
                <MessageCircle size={16} aria-hidden="true" />
                Message
              </button>
            )}
            <button type="button" onClick={() => decide('Declined')} className="btn btn-outline-danger">
              Decline
            </button>
            <button type="button" onClick={() => decide('Approved')} className="btn btn-primary">
              Approve
            </button>
          </>
        ) : (
          <>
            {listing && (
              <button type="button" onClick={messageBoarder} className="btn btn-outline-secondary me-auto">
                <MessageCircle size={16} aria-hidden="true" />
                Message boarder
              </button>
            )}
            <button type="button" onClick={onClose} className="btn btn-outline-secondary">
              Close
            </button>
          </>
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
