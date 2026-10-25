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
    <div className="space-y-8">
      <div>
        <PageHeader title="My Favorites" subtitle="Rooms you’ve saved to compare later." />
        {saved.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {saved.map((listing) => (
              <RoomCard key={listing.id} listing={listing} isFavorite onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="No saved rooms yet"
            body="Tap the heart on any listing to save it here."
            action={
              <Link to="/boarder/browse" className="btn-primary">
                Browse rooms
              </Link>
            }
          />
        )}
      </div>

      {recent.length > 0 && (
        <section>
          <SectionHeader title="Recently viewed" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.slice(0, 8).map((listing) => (
              <Link key={listing.id} to={`/boarder/rooms/${listing.id}`} className="card group flex items-center gap-3 p-2.5">
                <div className="aspect-square w-16 shrink-0 overflow-hidden rounded-lg">
                  <ListingImage listing={listing} kind="room" className="size-full" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold group-hover:text-accent">{listing.name}</p>
                  <p className="truncate text-xs text-muted">{listing.area}</p>
                  <p className="text-xs font-medium">{formatPeso(listing.price)}/mo</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
