import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import ListingRow from '../../components/listings/ListingRow'
import { EmptyState, Modal, Notice, PageHeader, Tabs } from '../../components/ui'

export default function MyListings() {
  const { myListings, deleteListing } = useData()
  const [tab, setTab] = useState('All')
  const [deleting, setDeleting] = useState(null)
  const toast = useToast()

  const tabs = ['All', 'Approved', 'Pending'].map((value) => ({
    value,
    label: value,
    count: value === 'All' ? myListings.length : myListings.filter((listing) => listing.approval === value).length,
  }))
  const visible = tab === 'All' ? myListings : myListings.filter((listing) => listing.approval === tab)
  const pendingCount = tabs[2].count

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

      {pendingCount > 0 && (
        <div className="mb-4">
          <Notice tone="info">
            {pendingCount} {pendingCount === 1 ? 'listing is' : 'listings are'} waiting for admin review. Boarders can see a listing once it’s approved, usually within 1–2 days.
          </Notice>
        </div>
      )}

      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Filter listings by approval status" />

      <div className="d-flex flex-column gap-3 mt-4">
        {visible.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={tab === 'All' ? 'No listings yet' : `No ${tab.toLowerCase()} listings`}
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
