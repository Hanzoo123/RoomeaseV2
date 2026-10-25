import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { distanceKm, formatDistance, formatPeso, VSU_COORDS } from '../../data/mockData'
import { RatingBadge } from '../reviews/Stars'
import { ListingImage } from '../ui'
import MapView from './MapView'

// Browse Rooms map mode: results list beside a map of price pins, linked both ways.
export default function ResultsMap({ listings }) {
  const { ratingOf } = useData()
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const itemRefs = useRef({})

  const highlighted = hoveredId ?? selectedId
  const markers = useMemo(
    () => listings.map((listing) => ({ id: listing.id, coords: listing.coords, label: formatPeso(listing.price), title: listing.name, active: listing.id === highlighted })),
    [listings, highlighted],
  )
  const selected = listings.find((listing) => listing.id === selectedId)

  function selectFromMap(id) {
    setSelectedId(id)
    itemRefs.current[id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  return (
    <div className="row g-3">
      <div className="col-lg-5 order-2 order-lg-1">
        <ul className="map-list list-unstyled d-flex flex-column gap-2 mb-0">
          {listings.map((listing) => (
            <li key={listing.id} ref={(node) => (itemRefs.current[listing.id] = node)}>
              <Link
                to={`/boarder/rooms/${listing.id}`}
                className={`card result-item card-hover p-2 d-flex flex-row align-items-center gap-3 text-reset-link ${listing.id === highlighted ? 'active' : ''}`}
                onMouseEnter={() => setHoveredId(listing.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(listing.id)}
                onBlur={() => setHoveredId(null)}
              >
                <div className="thumb-square" style={{ width: '5.5rem', height: '4.5rem' }}>
                  <ListingImage listing={listing} kind="room" />
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <p className="small fw-semibold text-truncate mb-0">{listing.name}</p>
                  <p className="text-xs text-body-secondary mb-1">
                    {listing.area} · {formatDistance(distanceKm(listing.coords, VSU_COORDS))} to VSU
                  </p>
                  <RatingBadge rating={ratingOf(listing.id)} />
                </div>
                <p className="small fw-bold text-body text-nowrap mb-0 pe-2">{formatPeso(listing.price)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-lg-7 order-1 order-lg-2">
        <div className="sticky-lg">
          <MapView markers={markers} onMarkerClick={selectFromMap} className="map-split" label="Map of boarding houses" />
          {selected && (
            <div className="card map-preview shadow">
              <div className="card-body p-2 d-flex align-items-center gap-3">
                <div className="thumb-square">
                  <ListingImage listing={selected} kind="room" />
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <p className="small fw-semibold text-truncate mb-0">{selected.name}</p>
                  <p className="text-xs text-body-secondary mb-1">
                    {formatPeso(selected.price)} / month · {selected.roomType}
                  </p>
                  <Link to={`/boarder/rooms/${selected.id}`} className="btn btn-sm btn-primary">
                    View details
                  </Link>
                </div>
                <button type="button" className="btn btn-link text-body-secondary p-1 align-self-start" onClick={() => setSelectedId(null)} aria-label="Close preview">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
