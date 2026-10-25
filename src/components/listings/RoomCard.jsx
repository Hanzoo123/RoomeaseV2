import { Link } from 'react-router-dom'
import { AirVent, Bath, BedDouble, BedSingle, BookOpen, Cctv, CookingPot, Heart, SquareParking, WashingMachine, Wifi } from 'lucide-react'
import { availabilityOf, formatPeso } from '../../data/mockData'
import { ListingImage, Tag } from '../ui'

export const FEATURE_ICONS = {
  'Single Room': BedSingle,
  'Shared Room': BedDouble,
  'Wi-Fi': Wifi,
  Aircon: AirVent,
  'Private CR': Bath,
  Laundry: WashingMachine,
  'Study Area': BookOpen,
  Kitchen: CookingPot,
  CCTV: Cctv,
  Parking: SquareParking,
}

export function FeatureList({ features, className = '' }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted ${className}`}>
      {features.map((feature) => {
        const Icon = FEATURE_ICONS[feature] ?? BedSingle
        return (
          <li key={feature} className="flex items-center gap-1.5">
            <Icon className="size-3.5 text-ink/70" aria-hidden="true" />
            {feature}
          </li>
        )
      })}
    </ul>
  )
}

export function FavoriteButton({ listing, isFavorite, onToggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(listing.id)}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remove ${listing.name} from favorites` : `Save ${listing.name} to favorites`}
      className={`grid size-8 place-items-center rounded-full bg-white shadow-md transition-transform hover:scale-105 ${className}`}
    >
      <Heart className={`size-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-ink'}`} aria-hidden="true" />
    </button>
  )
}

export default function RoomCard({ listing, isFavorite, onToggleFavorite }) {
  const extra = listing.amenities.length - 2
  const features = [listing.roomType, ...listing.amenities.slice(0, 2)]
  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <ListingImage listing={listing} kind="room" className="absolute inset-0 size-full" />
        <Tag className="absolute top-3 left-3 shadow-sm">{availabilityOf(listing)}</Tag>
        <FavoriteButton listing={listing} isFavorite={isFavorite} onToggle={onToggleFavorite} className="absolute top-3 right-3" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{listing.name}</h3>
        <p className="mt-0.5 text-sm text-muted">
          {listing.area}, {listing.city}
        </p>
        <p className="mt-3 text-sm text-muted">
          <span className="text-lg font-bold text-ink">{formatPeso(listing.price)}</span> / month
        </p>
        <div className="mt-3 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <FeatureList features={features} />
          {extra > 0 && <span className="text-xs text-muted">+{extra} more</span>}
        </div>
        <Link to={`/boarder/rooms/${listing.id}`} className="btn-primary mt-auto w-full">
          View Details
        </Link>
      </div>
    </article>
  )
}
