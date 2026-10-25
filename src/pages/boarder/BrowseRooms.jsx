import { useSearchParams } from 'react-router-dom'
import { ArrowUpDown, MapPin, Search, SearchX } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { AMENITIES, AREAS, ROOM_TYPES } from '../../data/mockData'
import RoomCard, { FEATURE_ICONS } from '../../components/listings/RoomCard'
import { RentBox, SelectBox } from '../../components/listings/FilterFields'
import { EmptyState, PageHeader } from '../../components/ui'

const SORTS = {
  recommended: { label: 'Recommended', compare: () => 0 },
  'price-asc': { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  availability: { label: 'Most rooms available', compare: (a, b) => b.availableRooms - a.availableRooms },
}

function matches(listing, filters) {
  const query = filters.q.trim().toLowerCase()
  if (query && !`${listing.name} ${listing.area} ${listing.address ?? ''}`.toLowerCase().includes(query)) return false
  if (filters.location && listing.area !== filters.location) return false
  if (filters.min && listing.price < Number(filters.min)) return false
  if (filters.max && listing.price > Number(filters.max)) return false
  if (filters.roomType && listing.roomType !== filters.roomType) return false
  if (filters.amenities.some((amenity) => !listing.amenities.includes(amenity))) return false
  if (filters.availableOnly && listing.availableRooms === 0) return false
  return true
}

export default function BrowseRooms() {
  const { publicListings, favorites, toggleFavorite } = useData()
  const [params, setParams] = useSearchParams()

  const filters = {
    q: params.get('q') ?? '',
    location: params.get('location') ?? '',
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    roomType: params.get('roomType') ?? '',
    amenities: params.get('amenities')?.split(',').filter(Boolean) ?? [],
    availableOnly: params.get('available') === '1',
    sort: SORTS[params.get('sort')] ? params.get('sort') : 'recommended',
  }

  function setFilter(key, value) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  function toggleAmenity(amenity) {
    const next = filters.amenities.includes(amenity)
      ? filters.amenities.filter((item) => item !== amenity)
      : [...filters.amenities, amenity]
    setFilter('amenities', next.join(','))
  }

  const priceError = filters.min && filters.max && Number(filters.min) > Number(filters.max)
  const results = publicListings.filter((listing) => matches(listing, filters)).sort(SORTS[filters.sort].compare)
  const hasFilters = [...params.keys()].some((key) => key !== 'sort')

  return (
    <div>
      <PageHeader title="Browse Rooms" subtitle={`${publicListings.length} approved boarding houses in Baybay City`} />

      <section className="card space-y-4 p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={filters.q}
            onChange={(event) => setFilter('q', event.target.value)}
            placeholder="Search by name, street or barangay"
            aria-label="Search boarding houses"
            className="h-12 w-full rounded-xl border border-line bg-white pr-4 pl-10 text-sm placeholder:text-muted/80 focus:border-accent focus:ring-2 focus:ring-accent/15 focus:outline-none"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectBox label="Location" icon={MapPin} value={filters.location} onChange={(value) => setFilter('location', value)}>
            <option value="">All of Baybay City</option>
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </SelectBox>
          <RentBox label="Min Rent" value={filters.min} onChange={(value) => setFilter('min', value)} />
          <RentBox label="Max Rent" value={filters.max} onChange={(value) => setFilter('max', value)} />
          <SelectBox label="Room Type" value={filters.roomType} onChange={(value) => setFilter('roomType', value)}>
            <option value="">Any Type</option>
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectBox>
        </div>
        {priceError && (
          <p role="alert" className="text-sm text-red-600">
            Min rent can’t be higher than max rent.
          </p>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-muted">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((amenity) => {
              const Icon = FEATURE_ICONS[amenity]
              const active = filters.amenities.includes(amenity)
              return (
                <button
                  key={amenity}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleAmenity(amenity)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? 'border-accent bg-accent text-white' : 'border-line bg-white text-ink hover:border-accent/50'
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {amenity}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(event) => setFilter('available', event.target.checked ? '1' : '')}
              className="size-4 accent-accent"
            />
            Only show houses with rooms available
          </label>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button type="button" onClick={() => setParams({}, { replace: true })} className="text-sm font-medium text-accent hover:underline">
                Clear filters
              </button>
            )}
            <label className="flex items-center gap-2 text-sm">
              <ArrowUpDown className="size-4 text-muted" aria-hidden="true" />
              <span className="sr-only">Sort by</span>
              <select
                value={filters.sort}
                onChange={(event) => setFilter('sort', event.target.value === 'recommended' ? '' : event.target.value)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-medium focus:border-accent focus:outline-none"
              >
                {Object.entries(SORTS).map(([value, sort]) => (
                  <option key={value} value={value}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <p className="mt-6 mb-4 text-sm text-muted" aria-live="polite">
        Showing <strong className="text-ink">{results.length}</strong> {results.length === 1 ? 'boarding house' : 'boarding houses'}
      </p>

      {results.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((listing) => (
            <RoomCard key={listing.id} listing={listing} isFavorite={favorites.includes(listing.id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No boarding houses match your filters"
          body="Try another location, widen your budget or remove some amenities."
          action={
            <button type="button" onClick={() => setParams({}, { replace: true })} className="btn-primary">
              Clear filters
            </button>
          }
        />
      )}
    </div>
  )
}
