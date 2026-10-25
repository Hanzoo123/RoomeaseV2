import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../data/mockData'
import { Modal, StatusPill } from '../ui'
import { TextArea } from '../ui/form'

const DECLINE_SUGGESTIONS = ['All rooms are taken for that month.', 'This room is for female boarders only.', 'Please visit first so we can talk about the terms.']

// Landlord view of one request, with approve / decline (and an optional reason) while it is pending.
export default function ReservationDialog({ reservation, listingName, onClose, onDecide }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { listingById, startConversation } = useData()
  const isPending = reservation.status === 'Pending'
  const listing = listingById(reservation.listingId)
  const toast = useToast()
  const [declining, setDeclining] = useState(false)
  const [note, setNote] = useState('')

  function decide(status) {
    onDecide(status, status === 'Declined' ? note.trim() : '')
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
        isPending && declining ? (
          <>
            <button type="button" onClick={() => setDeclining(false)} className="btn btn-outline-secondary me-auto">
              Back
            </button>
            <button type="button" onClick={() => decide('Declined')} className="btn btn-danger">
              Decline request
            </button>
          </>
        ) : isPending ? (
          <>
            {listing && (
              <button type="button" onClick={messageBoarder} className="btn btn-outline-secondary me-auto">
                <MessageCircle size={16} aria-hidden="true" />
                Message
              </button>
            )}
            <button type="button" onClick={() => setDeclining(true)} className="btn btn-outline-danger">
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
      {reservation.status === 'Declined' && reservation.landlordNote && (
        <p className="small text-body-secondary border-top pt-3 mt-3 mb-0">
          <strong className="text-body">Your reason:</strong> {reservation.landlordNote}
        </p>
      )}
      {isPending && declining && (
        <div className="border-top pt-3 mt-3">
          <p className="small fw-medium mb-2">Tell {reservation.boarder.split(' ')[0]} why (optional)</p>
          <div className="d-flex flex-wrap gap-2 mb-2" aria-label="Common reasons">
            {DECLINE_SUGGESTIONS.map((text) => (
              <button key={text} type="button" className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setNote(text)}>
                {text}
              </button>
            ))}
          </div>
          <TextArea
            id="decline-note"
            label="Reason shown to the boarder"
            rows={2}
            maxLength={300}
            placeholder="A short, kind reason helps them look elsewhere sooner."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      )}
    </Modal>
  )
}
