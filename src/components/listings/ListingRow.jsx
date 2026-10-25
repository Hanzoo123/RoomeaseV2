import { Link } from 'react-router-dom'
import { Eye, SquarePen } from 'lucide-react'
import { formatPeso } from '../../data/mockData'
import { ListingImage, Tag } from '../ui'

// Landlord-side summary row for one boarding house.
export default function ListingRow({ listing, children }) {
  return (
    <article className="card">
      <div className="card-body p-3 d-flex flex-column flex-sm-row align-items-sm-center gap-3">
        <div className="thumb thumb-lg">
          <div className="ratio" style={{ '--bs-aspect-ratio': '62.5%' }}>
            <ListingImage listing={listing} kind="house" />
          </div>
        </div>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <h3 className="fs-6 fw-semibold mb-0">{listing.name}</h3>
            <Tag tone="approval">{listing.approval}</Tag>
          </div>
          <p className="small text-body-secondary mt-1 mb-1">
            {listing.area}, {listing.city}
          </p>
          <p className="small text-body-secondary mb-2">
            <span className="fs-6 fw-bold text-body">{formatPeso(listing.price)}</span> / month
          </p>
          <span className="badge border bg-page text-body-secondary fw-normal">
            Available: {listing.availableRooms} of {listing.totalRooms} rooms
          </span>
        </div>
        <div className="d-flex gap-3 align-self-end small fw-medium">
          {children}
          <Link to={`/landlord/listings/${listing.id}/edit`} className="d-inline-flex align-items-center gap-1 text-reset-link">
            <SquarePen size={16} aria-hidden="true" />
            Edit
          </Link>
          <Link to={`/landlord/listings/${listing.id}`} className="d-inline-flex align-items-center gap-1 text-reset-link">
            <Eye size={16} aria-hidden="true" />
            View
          </Link>
        </div>
      </div>
    </article>
  )
}
