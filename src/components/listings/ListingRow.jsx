import { Link } from 'react-router-dom'
import { Eye, SquarePen } from 'lucide-react'
import { formatPeso } from '../../data/mockData'
import { ListingImage, Tag } from '../ui'

// Landlord-side summary row for one boarding house.
export default function ListingRow({ listing, children }) {
  return (
    <article className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
      <div className="aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl sm:w-40">
        <ListingImage listing={listing} kind="house" className="size-full" />
      </div>
      <div className="min-w-0 flex-1 px-1 sm:px-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{listing.name}</h3>
          <Tag tone="approval">{listing.approval}</Tag>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {listing.area}, {listing.city}
        </p>
        <p className="mt-1.5 text-sm text-muted">
          <span className="text-base font-bold text-ink">{formatPeso(listing.price)}</span> / month
        </p>
        <span className="mt-2 inline-block rounded-md border border-line bg-page px-2 py-1 text-xs text-muted">
          Available: {listing.availableRooms} of {listing.totalRooms} rooms
        </span>
      </div>
      <div className="flex gap-5 self-end px-1 pb-1 text-sm font-medium sm:px-2">
        {children}
        <Link to={`/landlord/listings/${listing.id}/edit`} className="inline-flex items-center gap-1.5 hover:text-accent">
          <SquarePen className="size-4" aria-hidden="true" />
          Edit
        </Link>
        <Link to={`/landlord/listings/${listing.id}`} className="inline-flex items-center gap-1.5 hover:text-accent">
          <Eye className="size-4" aria-hidden="true" />
          View
        </Link>
      </div>
    </article>
  )
}
