import { Link, useSearchParams } from 'react-router-dom'
import { ClipboardCheck, Search } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatPeso, timeAgo } from '../../data/mockData'
import { ModerationButtons, useModeration } from '../../components/admin/Moderation'
import ListingStatus, { listingStatus } from '../../components/listings/ListingStatus'
import { EmptyState, ListingImage, PageHeader, Tabs } from '../../components/ui'

const TABS = [
  { value: 'review', label: 'In review' },
  { value: 'live', label: 'Live' },
  { value: 'changes', label: 'Needs changes' },
  { value: 'removed', label: 'Removed' },
  { value: 'all', label: 'All' },
]

export default function ManageListings() {
  const { listings, ownerOf } = useData()
  const [params, setParams] = useSearchParams()
  const [actions, dialog] = useModeration()

  const tab = TABS.some((item) => item.value === params.get('tab')) ? params.get('tab') : 'review'
  const query = params.get('q') ?? ''
  const setParam = (key, value) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const needle = query.trim().toLowerCase()
  const searched = listings.filter((listing) => !needle || `${listing.name} ${listing.area} ${listing.address ?? ''} ${ownerOf(listing).name}`.toLowerCase().includes(needle))
  const counts = Object.fromEntries(TABS.map(({ value }) => [value, value === 'all' ? searched.length : searched.filter((listing) => listingStatus(listing).key === value).length]))
  // The review queue is oldest first; other tabs show the newest first.
  const rows = searched
    .filter((listing) => tab === 'all' || listingStatus(listing).key === tab)
    .sort((a, b) => (tab === 'review' ? 1 : -1) * (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''))

  return (
    <div>
      <PageHeader title="Manage Listings" subtitle="Approve new boarding houses, send them back with a reason, or take down ones that break the rules." />

      <div className="d-flex flex-column flex-lg-row gap-3 mb-3">
        <div className="flex-grow-1">
          <Tabs tabs={TABS.map((item) => ({ ...item, count: counts[item.value] }))} value={tab} onChange={(value) => setParam('tab', value === 'review' ? '' : value)} label="Listing status" />
        </div>
        <div className="input-icon" style={{ minWidth: '16rem' }}>
          <Search size={16} className="lead-icon" aria-hidden="true" />
          <input type="search" className="form-control" placeholder="Search name, area or landlord" aria-label="Search listings" value={query} onChange={(event) => setParam('q', event.target.value)} />
        </div>
      </div>

      {rows.length ? (
        <div className="card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Boarding house</th>
                  <th scope="col">Landlord</th>
                  <th scope="col" className="text-end">
                    Rent
                  </th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((listing) => (
                  <tr key={listing.id}>
                    <td style={{ minWidth: '16rem' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="thumb-square flex-shrink-0" style={{ width: '3rem', height: '3rem' }}>
                          <ListingImage listing={listing} kind="house" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <Link to={`/admin/listings/${listing.id}`} className="small fw-semibold text-reset-link">
                            {listing.name}
                          </Link>
                          <p className="text-xs text-body-secondary mb-0">
                            {listing.area} · {listing.roomType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="small text-nowrap">{ownerOf(listing).name}</td>
                    <td className="small text-end text-nowrap">{formatPeso(listing.price)}</td>
                    <td className="small text-body-secondary text-nowrap">{listing.submittedAt ? timeAgo(listing.submittedAt) : '—'}</td>
                    <td>
                      <ListingStatus listing={listing} />
                      {listing.approval === 'Rejected' && listing.rejectionReason && (
                        <p className="text-2xs text-body-secondary text-truncate mb-0 mt-1" style={{ maxWidth: '12rem' }} title={listing.rejectionReason}>
                          {listing.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="text-end" style={{ minWidth: '13rem' }}>
                      <div className="d-flex justify-content-end gap-2">
                        <ModerationButtons listing={listing} actions={actions} />
                        <Link to={`/admin/listings/${listing.id}`} className="btn btn-sm btn-outline-secondary">
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardCheck}
          title={query ? 'No listings match your search' : tab === 'review' ? 'Nothing waiting for review' : 'No listings here'}
          body={tab === 'review' && !query ? 'New listings show up here as soon as a landlord submits them.' : 'Try another tab or search.'}
        />
      )}
      {dialog}
    </div>
  )
}
