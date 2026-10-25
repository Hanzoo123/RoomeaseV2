import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import ListingRow from '../../components/listings/ListingRow'
import { listingStatus } from '../../components/listings/ListingStatus'
import { EmptyState, Modal, Notice, PageHeader, Tabs } from '../../components/ui'

// Same states as the admin sees: In review → Live, or Needs changes (with the reason).
const TAB_KEYS = { All: null, Live: 'live', 'In review': 'review', 'Needs changes': 'changes', Removed: 'removed' }
const inTab = (listing, value) => !TAB_KEYS[value] || listingStatus(listing).key === TAB_KEYS[value]

export default function MyListings() {
  const { myListings, deleteListing } = useData()
  const [tab, setTab] = useState('All')
  const [deleting, setDeleting] = useState(null)
  const toast = useToast()

  const tabs = Object.keys(TAB_KEYS)
    .map((value) => ({ value, label: value, count: myListings.filter((listing) => inTab(listing, value)).length }))
    .filter((item) => item.value !== 'Removed' || item.count > 0)
  const visible = myListings.filter((listing) => inTab(listing, tab))
  const pendingCount = myListings.filter((listing) => inTab(listing, 'In review')).length
  const changesCount = myListings.filter((listing) => inTab(listing, 'Needs changes')).length

  return (
    <div>
      <PageHeader
        title="My Boarding Houses"
        subtitle="Edit details, check approval status and manage your listings."
        actions={
          <Link to="/landlord/add-listing" className="btn btn-primary">
            <Plus size={16} aria-hidden="true" />
            Add New Listing
          </Link>
        }
      />

      {changesCount > 0 && (
        <div className="mb-3">
          <Notice tone="error">
            {changesCount} {changesCount === 1 ? 'listing needs' : 'listings need'} changes before boarders can see {changesCount === 1 ? 'it' : 'them'}. The admin’s reason is shown on each one.
          </Notice>
        </div>
      )}
      {pendingCount > 0 && (
        <div className="mb-4">
          <Notice tone="info">
            {pendingCount} {pendingCount === 1 ? 'listing is' : 'listings are'} in review. Boarders can see a listing once an admin approves it, usually within a few days.
          </Notice>
        </div>
      )}

      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Filter listings by approval status" />

      <div className="d-flex flex-column gap-3 mt-4">
        {visible.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={tab === 'All' ? 'No listings yet' : `Nothing under “${tab}”`}
            body="Add a boarding house so boarders can discover it."
            action={
              <Link to="/landlord/add-listing" className="btn btn-primary">
                Add New Listing
              </Link>
            }
          />
        ) : (
          visible.map((listing) => (
            <ListingRow key={listing.id} listing={listing}>
              <button type="button" onClick={() => setDeleting(listing)} className="btn btn-link p-0 small fw-medium link-danger text-decoration-none d-inline-flex align-items-center gap-1">
                <Trash2 size={16} aria-hidden="true" />
                Delete
              </button>
            </ListingRow>
          ))
        )}
      </div>

      {deleting && (
        <Modal
          title="Delete this listing?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button type="button" onClick={() => setDeleting(null)} className="btn btn-outline-secondary">
                Keep listing
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteListing(deleting.id)
                  toast(`${deleting.name} was deleted.`, 'info')
                  setDeleting(null)
                }}
                className="btn btn-danger"
              >
                Delete
              </button>
            </>
          }
        >
          <p className="small text-body-secondary mb-0">
            <strong className="text-body">{deleting.name}</strong> will be removed from RoomEase and boarders won’t be able to find it. This can’t be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}
