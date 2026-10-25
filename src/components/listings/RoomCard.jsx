import { Link } from 'react-router-dom'
import { AirVent, Bath, Bed, BedDouble, BedSingle, BookOpen, Cctv, CookingPot, DoorClosed, Heart, Navigation, SquareParking, Users, WashingMachine, Wifi } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useRequireBoarder, useSitePaths } from '../../context/SitePaths'
import { useToast } from '../../context/ToastContext'
import { availabilityOf, formatPeso } from '../../data/mockData'
import { RatingBadge } from '../reviews/Stars'
import { CompareButton } from './CompareControls'
import { ListingImage, Tag } from '../ui'

export const FEATURE_ICONS = {
  'Single Room': BedSingle,
  'Private Room': DoorClosed,
  'Double Sharing': BedDouble,
  'Bed Spacer': Bed,
  Dormitory: Users,
  'Wi-Fi': Wifi,
  Aircon: AirVent,
  'Private CR': Bath,
  Laundry: WashingMachine,
  'Study Area': BookOpen,
  Kitchen: CookingPot,
  CCTV: Cctv,
  Parking: SquareParking,
}

export function FeatureList({ features, className = 'text-xs', iconSize = 14 }) {
  return (
    <ul className={`list-unstyled d-flex flex-wrap column-gap-3 row-gap-1 text-body-secondary mb-0 ${className}`}>
      {features.map((feature) => {
        const Icon = FEATURE_ICONS[feature] ?? BedSingle
        return (
          <li key={feature} className="d-flex align-items-center gap-1">
            <Icon size={iconSize} className="text-body" aria-hidden="true" />
            {feature}
          </li>
        )
      })}
    </ul>
  )
}

export function FavoriteButton({ listing, isFavorite, onToggle, className = '' }) {
  const toast = useToast()
  const requireBoarder = useRequireBoarder()
  return (
    <button
      type="button"
      onClick={() => {
        if (!requireBoarder('save rooms to your favorites')) return
        onToggle(listing.id)
        toast(isFavorite ? `${listing.name} removed from favorites.` : `${listing.name} saved to favorites.`, isFavorite ? 'info' : 'success')
      }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remove ${listing.name} from favorites` : `Save ${listing.name} to favorites`}
      className={`fav-btn ${className}`}
    >
      <Heart size={16} className={isFavorite ? 'text-danger' : 'text-body'} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}

export default function RoomCard({ listing, isFavorite, onToggleFavorite, distance }) {
  const { ratingOf } = useData()
  const paths = useSitePaths()
  const extra = listing.amenities.length - 2
  const features = [listing.roomType, ...listing.amenities.slice(0, 2)]
  return (
    <article className="card h-100 overflow-hidden">
      <div className="position-relative">
        <div className="ratio" style={{ '--bs-aspect-ratio': '62.5%' }}>
          <ListingImage listing={listing} kind="room" />
        </div>
        <Tag className="position-absolute top-0 start-0 m-3 shadow-sm">{availabilityOf(listing)}</Tag>
        <FavoriteButton listing={listing} isFavorite={isFavorite} onToggle={onToggleFavorite} className="position-absolute top-0 end-0 m-3" />
      </div>
      <div className="card-body d-flex flex-column">
        <h3 className="fs-6 fw-semibold mb-1">{listing.name}</h3>
        <p className="small text-body-secondary mb-1">
          {listing.area}, {listing.city}
        </p>
        {distance && (
          <p className="d-flex align-items-center gap-1 text-xs fw-medium text-primary mb-1">
            <Navigation size={12} aria-hidden="true" />
            {distance}
          </p>
        )}
        <RatingBadge rating={ratingOf(listing.id)} className="mb-2" />
        <p className="small text-body-secondary mb-3">
          <span className="fs-5 fw-bold text-body">{formatPeso(listing.price)}</span> / month
        </p>
        <div className="d-flex flex-wrap align-items-center column-gap-3 row-gap-1 mb-3">
          <FeatureList features={features} />
          {extra > 0 && <span className="text-xs text-body-secondary">+{extra} more</span>}
        </div>
        <div className="d-flex gap-2 mt-auto">
          <Link to={paths.room(listing.id)} className="btn btn-primary flex-grow-1">
            View Details
          </Link>
          <CompareButton listing={listing} />
        </div>
      </div>
    </article>
  )
}
