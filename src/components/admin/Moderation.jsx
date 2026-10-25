import { useState } from 'react'
import { Ban, Check, RotateCcw, X } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { listingStatus } from '../listings/ListingStatus'
import ReasonDialog from './ReasonDialog'

const REJECT_SUGGESTIONS = [
  'Please add the full street address, so boarders can find the house.',
  'Please add at least one photo of a room.',
  'The rent looks wrong. Please check the monthly amount.',
  'Please list which bills are included in the rent.',
]
const REMOVE_SUGGESTIONS = ['Reported as no longer renting rooms.', 'The photos are not of this property.', 'Repeated complaints from boarders.']

// Approve / reject / remove / restore, shared by this table and the review page.
export function useModeration() {
  const { moderateListing, setListingRemoved } = useData()
  const toast = useToast()
  const [dialog, setDialog] = useState(null)

  const actions = {
    approve: (listing) => {
      moderateListing(listing.id, 'Approved')
      toast(`${listing.name} is now live.`)
    },
    reject: (listing) => setDialog({ kind: 'reject', listing }),
    remove: (listing) => setDialog({ kind: 'remove', listing }),
    restore: (listing) => {
      setListingRemoved(listing.id, false)
      toast(`${listing.name} was restored.`)
    },
  }

  const dialogElement =
    dialog?.kind === 'reject' ? (
      <ReasonDialog
        title={`Send back “${dialog.listing.name}”`}
        intro="The landlord sees this reason on their listing. Once they fix it and save, the listing comes back to the review queue."
        label="What needs to change?"
        suggestions={REJECT_SUGGESTIONS}
        confirmLabel="Send back for changes"
        onClose={() => setDialog(null)}
        onConfirm={(reason) => {
          moderateListing(dialog.listing.id, 'Rejected', reason)
          toast(`${dialog.listing.name} was sent back to the landlord.`, 'info')
          setDialog(null)
        }}
      />
    ) : dialog?.kind === 'remove' ? (
      <ReasonDialog
        title={`Remove “${dialog.listing.name}”`}
        intro="The listing is hidden from boarders but kept, so it can be restored later. The landlord is notified with your reason."
        suggestions={REMOVE_SUGGESTIONS}
        confirmLabel="Remove listing"
        onClose={() => setDialog(null)}
        onConfirm={(reason) => {
          setListingRemoved(dialog.listing.id, true, reason)
          toast(`${dialog.listing.name} was removed from the site.`, 'info')
          setDialog(null)
        }}
      />
    ) : null

  return [actions, dialogElement]
}

export function ModerationButtons({ listing, actions, size = 'sm' }) {
  const status = listingStatus(listing).key
  const btn = size === 'md' ? 'btn' : `btn btn-${size}`
  return (
    <div className="d-flex flex-wrap gap-2">
      {status === 'review' && (
        <>
          <button type="button" className={`${btn} btn-success`} onClick={() => actions.approve(listing)}>
            <Check size={14} aria-hidden="true" />
            Approve
          </button>
          <button type="button" className={`${btn} btn-outline-danger`} onClick={() => actions.reject(listing)}>
            <X size={14} aria-hidden="true" />
            Reject
          </button>
        </>
      )}
      {status === 'live' && (
        <button type="button" className={`${btn} btn-outline-danger`} onClick={() => actions.remove(listing)}>
          <Ban size={14} aria-hidden="true" />
          Remove
        </button>
      )}
      {status === 'changes' && (
        <button type="button" className={`${btn} btn-outline-success`} onClick={() => actions.approve(listing)}>
          <Check size={14} aria-hidden="true" />
          Approve anyway
        </button>
      )}
      {status === 'removed' && (
        <button type="button" className={`${btn} btn-outline-success`} onClick={() => actions.restore(listing)}>
          <RotateCcw size={14} aria-hidden="true" />
          Restore
        </button>
      )}
    </div>
  )
}
