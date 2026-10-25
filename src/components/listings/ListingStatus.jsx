// One status for a listing across the landlord and admin pages, using the PHP site's wording.
export function listingStatus(listing) {
  if (listing.removed) return { key: 'removed', label: 'Removed', className: 'text-bg-dark' }
  if (listing.approval === 'Approved') return { key: 'live', label: 'Live', className: 'text-bg-success' }
  if (listing.approval === 'Rejected') return { key: 'changes', label: 'Needs changes', className: 'text-bg-danger' }
  return { key: 'review', label: 'In review', className: 'text-bg-warning' }
}

export default function ListingStatus({ listing, className = '' }) {
  const status = listingStatus(listing)
  return <span className={`badge ${status.className} ${className}`}>{status.label}</span>
}
