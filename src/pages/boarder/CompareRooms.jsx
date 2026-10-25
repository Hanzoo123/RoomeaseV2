import { Link } from 'react-router-dom'
import { Award, Check, Minus, Scale, X } from 'lucide-react'
import { MAX_COMPARE, useData } from '../../context/DataContext'
import { AMENITIES, availabilityOf, BAYBAY_CENTER, distanceKm, formatDistance, formatPeso, VSU_COORDS } from '../../data/mockData'
import { Stars } from '../../components/reviews/Stars'
import { EmptyState, ListingImage, PageHeader, Tag } from '../../components/ui'

function BestBadge({ children }) {
  return (
    <span className="badge rounded-pill bg-success-subtle text-success-emphasis d-inline-flex align-items-center gap-1 mt-1">
      <Award size={12} aria-hidden="true" />
      {children}
    </span>
  )
}

export default function CompareRooms() {
  const { compare, listingById, toggleCompare, clearCompare, ratingOf, ownerOf } = useData()
  const rooms = compare.map(listingById).filter(Boolean)

  if (rooms.length < 2) {
    return (
      <div>
        <PageHeader title="Compare rooms" subtitle={`Pick 2 to ${MAX_COMPARE} rooms to see them side by side.`} />
        <EmptyState
          icon={Scale}
          title={rooms.length ? 'Add one more room to compare' : 'No rooms selected yet'}
          body="Tap the compare button (the scale icon) on any room card in Browse Rooms."
          action={
            <Link to="/boarder/browse" className="btn btn-primary">
              Browse rooms
            </Link>
          }
        />
      </div>
    )
  }

  const stats = rooms.map((room) => ({
    room,
    rating: ratingOf(room.id),
    toVsu: distanceKm(room.coords, VSU_COORDS),
    toTown: distanceKm(room.coords, BAYBAY_CENTER),
  }))
  const lowestPrice = Math.min(...rooms.map((room) => room.price))
  const bestRating = Math.max(...stats.map((item) => item.rating.average))
  const closestVsu = Math.min(...stats.map((item) => item.toVsu))
  const mostRooms = Math.max(...rooms.map((room) => room.availableRooms))

  const rows = [
    {
      label: 'Monthly rent',
      cell: ({ room }) => (
        <>
          <span className="fw-bold">{formatPeso(room.price)}</span>
          {room.price === lowestPrice && <BestBadge>Lowest price</BestBadge>}
        </>
      ),
    },
    {
      label: 'Rating',
      cell: ({ rating }) =>
        rating.count ? (
          <>
            <Stars value={rating.average} />{' '}
            <span className="small">
              {rating.average.toFixed(1)} ({rating.count})
            </span>
            {rating.average === bestRating && <BestBadge>Top rated</BestBadge>}
          </>
        ) : (
          <span className="text-body-secondary small">No reviews yet</span>
        ),
    },
    {
      label: 'Distance to VSU',
      cell: ({ toVsu }) => (
        <>
          {formatDistance(toVsu)}
          {toVsu === closestVsu && <BestBadge>Closest</BestBadge>}
        </>
      ),
    },
    { label: 'Distance to town center', cell: ({ toTown }) => formatDistance(toTown) },
    { label: 'Location', cell: ({ room }) => room.area },
    { label: 'Room type', cell: ({ room }) => room.roomType },
    {
      label: 'Availability',
      cell: ({ room }) => (
        <>
          <Tag>{availabilityOf(room)}</Tag>
          <span className="d-block small text-body-secondary mt-1">
            {room.availableRooms} of {room.totalRooms} rooms · {room.availableSlots} slots
          </span>
          {room.availableRooms === mostRooms && mostRooms > 0 && <BestBadge>Most rooms open</BestBadge>}
        </>
      ),
    },
    ...AMENITIES.map((amenity) => ({
      label: amenity,
      amenity: true,
      cell: ({ room }) =>
        room.amenities.includes(amenity) ? (
          <Check size={18} className="text-success" aria-label="Yes" />
        ) : (
          <Minus size={18} className="text-body-secondary opacity-50" aria-label="No" />
        ),
    })),
    { label: 'Landlord', cell: ({ room }) => ownerOf(room).name },
  ]

  return (
    <div>
      <PageHeader
        title="Compare rooms"
        subtitle="Best values in each row are highlighted."
        actions={
          <>
            {rooms.length < MAX_COMPARE && (
              <Link to="/boarder/browse" className="btn btn-outline-secondary">
                Add another room
              </Link>
            )}
            <button type="button" className="btn btn-outline-danger" onClick={clearCompare}>
              Clear all
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0 compare-table">
            <thead>
              <tr>
                <th scope="col" className="compare-label">
                  <span className="visually-hidden">Feature</span>
                </th>
                {stats.map(({ room }) => (
                  <th key={room.id} scope="col" className="fw-normal">
                    <div className="position-relative">
                      <div className="ratio rounded-3 overflow-hidden mb-2" style={{ '--bs-aspect-ratio': '62.5%' }}>
                        <ListingImage listing={room} kind="room" />
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border rounded-circle position-absolute top-0 end-0 m-2 p-1 lh-1"
                        onClick={() => toggleCompare(room.id)}
                        aria-label={`Remove ${room.name} from compare`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <Link to={`/boarder/rooms/${room.id}`} className="fw-semibold text-reset-link">
                      {room.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.label} className={row.amenity && index > 0 && !rows[index - 1].amenity ? 'border-top border-2' : ''}>
                  <th scope="row" className="compare-label small fw-medium text-body-secondary">
                    {row.label}
                  </th>
                  {stats.map((item) => (
                    <td key={item.room.id} className="small">
                      {row.cell(item)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="compare-label" />
                {stats.map(({ room }) => (
                  <td key={room.id}>
                    <Link to={`/boarder/rooms/${room.id}`} className="btn btn-primary btn-sm w-100">
                      View & reserve
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
