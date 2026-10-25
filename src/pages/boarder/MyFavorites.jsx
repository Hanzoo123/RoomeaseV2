import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatPeso } from '../../data/mockData'
import RoomCard from '../../components/listings/RoomCard'
import { EmptyState, ListingImage, PageHeader, SectionHeader } from '../../components/ui'

export default function MyFavorites() {
  const { publicListings, favorites, recentlyViewed, toggleFavorite } = useData()
  const saved = publicListings.filter((listing) => favorites.includes(listing.id))
  const recent = recentlyViewed.map((id) => publicListings.find((listing) => listing.id === id)).filter(Boolean)

  return (
    <div className="d-flex flex-column gap-5">
      <div>
        <PageHeader title="My Favorites" subtitle="Rooms you’ve saved to compare later." />
        {saved.length > 0 ? (
          <div className="row g-4">
            {saved.map((listing) => (
              <div key={listing.id} className="col-sm-6 col-xl-4">
                <RoomCard listing={listing} isFavorite onToggleFavorite={toggleFavorite} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="No saved rooms yet"
            body="Tap the heart on any listing to save it here."
            action={
              <Link to="/boarder/browse" className="btn btn-primary">
                Browse rooms
              </Link>
            }
          />
        )}
      </div>

      {recent.length > 0 && (
        <section>
          <SectionHeader title="Recently viewed" />
          <div className="row g-3">
            {recent.slice(0, 8).map((listing) => (
              <div key={listing.id} className="col-sm-6 col-lg-3">
                <Link to={`/boarder/rooms/${listing.id}`} className="card h-100 p-2 d-flex flex-row align-items-center gap-3 text-reset-link">
                  <div className="thumb-square">
                    <ListingImage listing={listing} kind="room" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="small fw-semibold text-truncate mb-0">{listing.name}</p>
                    <p className="text-xs text-body-secondary text-truncate mb-0">{listing.area}</p>
                    <p className="text-xs fw-medium text-body mb-0">{formatPeso(listing.price)}/mo</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
