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
    const next = filters.amenities.includes(amenity) ? filters.amenities.filter((item) => item !== amenity) : [...filters.amenities, amenity]
    setFilter('amenities', next.join(','))
  }

  const clearFilters = () => setParams({}, { replace: true })
  const priceError = filters.min && filters.max && Number(filters.min) > Number(filters.max)
  const results = publicListings.filter((listing) => matches(listing, filters)).sort(SORTS[filters.sort].compare)
  const hasFilters = [...params.keys()].some((key) => key !== 'sort')

  return (
    <div>
      <PageHeader title="Browse Rooms" subtitle={`${publicListings.length} approved boarding houses in Baybay City`} />

      <section className="card">
        <div className="card-body p-3 p-sm-4 d-flex flex-column gap-3">
          <div className="input-icon">
            <Search size={16} className="lead-icon" aria-hidden="true" />
            <input
              type="search"
              value={filters.q}
              onChange={(event) => setFilter('q', event.target.value)}
              placeholder="Search by name, street or barangay"
              aria-label="Search boarding houses"
              className="form-control rounded-3"
              style={{ height: '3rem' }}
            />
          </div>

          <div className="row g-3">
            <div className="col-sm-6 col-lg-3">
              <SelectBox label="Location" icon={MapPin} value={filters.location} onChange={(value) => setFilter('location', value)}>
                <option value="">All of Baybay City</option>
                {AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </SelectBox>
            </div>
            <div className="col-sm-6 col-lg-3">
              <RentBox label="Min Rent" value={filters.min} onChange={(value) => setFilter('min', value)} />
            </div>
            <div className="col-sm-6 col-lg-3">
              <RentBox label="Max Rent" value={filters.max} onChange={(value) => setFilter('max', value)} />
            </div>
            <div className="col-sm-6 col-lg-3">
              <SelectBox label="Room Type" value={filters.roomType} onChange={(value) => setFilter('roomType', value)}>
                <option value="">Any Type</option>
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectBox>
            </div>
          </div>
          {priceError && (
            <p role="alert" className="small text-danger mb-0">
              Min rent can’t be higher than max rent.
            </p>
          )}

          <div>
            <p className="text-xs fw-medium text-body-secondary mb-2">Amenities</p>
            <div className="d-flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => {
                const Icon = FEATURE_ICONS[amenity]
                const active = filters.amenities.includes(amenity)
                return (
                  <button
                    key={amenity}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleAmenity(amenity)}
                    className={`btn btn-sm rounded-pill fw-medium ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {amenity}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 border-top pt-3">
            <div className="form-check small mb-0">
              <input
                id="available-only"
                type="checkbox"
                className="form-check-input"
                checked={filters.availableOnly}
                onChange={(event) => setFilter('available', event.target.checked ? '1' : '')}
              />
              <label htmlFor="available-only" className="form-check-label">
                Only show houses with rooms available
              </label>
            </div>
            <div className="d-flex align-items-center gap-3">
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="btn btn-link p-0 small fw-medium text-decoration-none">
                  Clear filters
                </button>
              )}
              <label className="d-flex align-items-center gap-2 small">
                <ArrowUpDown size={16} className="text-body-secondary" aria-hidden="true" />
                <span className="visually-hidden">Sort by</span>
                <select
                  value={filters.sort}
                  onChange={(event) => setFilter('sort', event.target.value === 'recommended' ? '' : event.target.value)}
                  className="form-select form-select-sm fw-medium"
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
        </div>
      </section>

      <p className="small text-body-secondary mt-4 mb-3" aria-live="polite">
        Showing <strong className="text-body">{results.length}</strong> {results.length === 1 ? 'boarding house' : 'boarding houses'}
      </p>

      {results.length > 0 ? (
        <div className="row g-4">
          {results.map((listing) => (
            <div key={listing.id} className="col-sm-6 col-xl-4">
              <RoomCard listing={listing} isFavorite={favorites.includes(listing.id)} onToggleFavorite={toggleFavorite} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No boarding houses match your filters"
          body="Try another location, widen your budget or remove some amenities."
          action={
            <button type="button" onClick={clearFilters} className="btn btn-primary">
              Clear filters
            </button>
          }
        />
      )}
    </div>
  )
}
