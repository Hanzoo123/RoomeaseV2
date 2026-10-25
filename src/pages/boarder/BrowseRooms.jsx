import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpDown, LayoutGrid, LoaderCircle, LocateFixed, Map as MapIcon, MapPin, Navigation, Scale, Search, SearchX, Users } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useSitePaths } from '../../context/SitePaths'
import { AMENITIES, AREAS, BAYBAY_CENTER, distanceKm, formatDistance, ROOM_TYPES, VSU_COORDS } from '../../data/mockData'
import RoomCard, { FEATURE_ICONS } from '../../components/listings/RoomCard'
import ResultsMap from '../../components/map/ResultsMap'
import useMyLocation from '../../components/map/useMyLocation'
import { RentBox, SelectBox } from '../../components/listings/FilterFields'
import { EmptyState, PageHeader } from '../../components/ui'

const SORTS = {
  recommended: { label: 'Recommended', compare: () => 0 },
  nearest: { label: 'Nearest first', compare: (a, b, { distanceOf }) => distanceOf(a) - distanceOf(b) },
  rating: { label: 'Top rated', compare: (a, b, { ratingOf }) => ratingOf(b.id).average - ratingOf(a.id).average },
  'price-asc': { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  availability: { label: 'Most rooms available', compare: (a, b) => b.availableRooms - a.availableRooms },
}

// Distances are measured from one of these points ("me" needs the visitor's location).
const ORIGINS = {
  vsu: { label: 'VSU', coords: VSU_COORDS },
  center: { label: 'the town center', coords: BAYBAY_CENTER },
  me: { label: 'you', coords: null },
}
const WITHIN_OPTIONS = ['0.5', '1', '2', '5']
const FAR_FROM_BAYBAY_KM = 30

const STAY_OPTIONS = {
  female: { label: 'Open to women', allows: ['any', 'female'] },
  male: { label: 'Open to men', allows: ['any', 'male'] },
}

function matches(listing, filters, distanceOf) {
  const query = filters.q.trim().toLowerCase()
  if (query && !`${listing.name} ${listing.area} ${listing.address ?? ''}`.toLowerCase().includes(query)) return false
  if (filters.location && listing.area !== filters.location) return false
  if (filters.min && listing.price < Number(filters.min)) return false
  if (filters.max && listing.price > Number(filters.max)) return false
  if (filters.roomType && listing.roomType !== filters.roomType) return false
  if (filters.amenities.some((amenity) => !listing.amenities.includes(amenity))) return false
  if (filters.availableOnly && listing.availableRooms === 0) return false
  if (filters.stay && !STAY_OPTIONS[filters.stay].allows.includes(listing.genderPolicy)) return false
  if (filters.within && distanceOf(listing) > Number(filters.within)) return false
  return true
}

export default function BrowseRooms() {
  const { publicListings, favorites, toggleFavorite, ratingOf, compare } = useData()
  const paths = useSitePaths()
  const [params, setParams] = useSearchParams()
  const { position, locating, locate } = useMyLocation()

  const filters = {
    q: params.get('q') ?? '',
    location: params.get('location') ?? '',
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    roomType: params.get('roomType') ?? '',
    amenities: params.get('amenities')?.split(',').filter(Boolean) ?? [],
    availableOnly: params.get('available') === '1',
    stay: STAY_OPTIONS[params.get('stay')] ? params.get('stay') : '',
    within: WITHIN_OPTIONS.includes(params.get('within')) ? params.get('within') : '',
    // "me" falls back to VSU until the browser shares a location (e.g. after a reload in a new tab).
    from: ORIGINS[params.get('from')] && (params.get('from') !== 'me' || position) ? params.get('from') : 'vsu',
    sort: SORTS[params.get('sort')] ? params.get('sort') : 'recommended',
  }
  const origin = filters.from === 'me' ? { ...ORIGINS.me, coords: position } : ORIGINS[filters.from]
  const distanceOf = (listing) => distanceKm(listing.coords, origin.coords)
  const farAway = filters.from === 'me' && distanceKm(position, BAYBAY_CENTER) > FAR_FROM_BAYBAY_KM

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

  function findNearMe() {
    locate(() =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set('from', 'me')
          next.set('sort', 'nearest')
          return next
        },
        { replace: true },
      ),
    )
  }

  function toggleAmenity(amenity) {
    const next = filters.amenities.includes(amenity) ? filters.amenities.filter((item) => item !== amenity) : [...filters.amenities, amenity]
    setFilter('amenities', next.join(','))
  }

  const clearFilters = () => setParams(params.get('view') === 'map' ? { view: 'map' } : {}, { replace: true })
  const priceError = filters.min && filters.max && Number(filters.min) > Number(filters.max)
  const results = publicListings.filter((listing) => matches(listing, filters, distanceOf)).sort((a, b) => SORTS[filters.sort].compare(a, b, { ratingOf, distanceOf }))
  // Cards show the distance whenever the visitor is filtering or sorting by it.
  const showDistance = filters.from === 'me' || filters.within || filters.sort === 'nearest'
  const hasFilters = [...params.keys()].some((key) => key !== 'sort' && key !== 'view')
  const view = params.get('view') === 'map' ? 'map' : 'grid'

  return (
    <div>
      <PageHeader
        title={paths.isPublic ? 'Find a Place to Stay' : 'Browse Rooms'}
        subtitle={`${publicListings.length} approved boarding houses in Baybay City`}
        actions={
          <>
            <button type="button" className={`btn ${filters.from === 'me' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={findNearMe} disabled={locating}>
              {locating ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <LocateFixed size={16} aria-hidden="true" />}
              {locating ? 'Finding you…' : 'Near me'}
            </button>
            {compare.length > 0 && (
              <Link to={paths.compare} className="btn btn-outline-primary">
                <Scale size={16} aria-hidden="true" />
                Compare ({compare.length})
              </Link>
            )}
          </>
        }
      />

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
          <div className="row g-3">
            <div className="col-sm-6 col-lg-3">
              <SelectBox label="Distance" icon={Navigation} value={filters.within} onChange={(value) => setFilter('within', value)}>
                <option value="">Any distance</option>
                {WITHIN_OPTIONS.map((km) => (
                  <option key={km} value={km}>
                    Within {formatDistance(Number(km))}
                  </option>
                ))}
              </SelectBox>
            </div>
            <div className="col-sm-6 col-lg-3">
              <SelectBox
                label="Measured from"
                icon={MapPin}
                value={filters.from}
                onChange={(value) => (value === 'me' && !position ? findNearMe() : setFilter('from', value === 'vsu' ? '' : value))}
              >
                <option value="vsu">VSU campus</option>
                <option value="center">Baybay town center</option>
                <option value="me">My location</option>
              </SelectBox>
            </div>
            <div className="col-sm-6 col-lg-3">
              <SelectBox label="Who can stay" icon={Users} value={filters.stay} onChange={(value) => setFilter('stay', value)}>
                <option value="">Any house</option>
                {Object.entries(STAY_OPTIONS).map(([value, option]) => (
                  <option key={value} value={value}>
                    {option.label}
                  </option>
                ))}
              </SelectBox>
            </div>
          </div>
          {farAway && (
            <p className="small text-body-secondary mb-0">
              You’re about {formatDistance(distanceKm(position, BAYBAY_CENTER))} from Baybay City, so distances are measured from where you are now.
            </p>
          )}
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

      <div className="d-flex align-items-center justify-content-between gap-3 mt-4 mb-3">
        <p className="small text-body-secondary mb-0" aria-live="polite">
          Showing <strong className="text-body">{results.length}</strong> {results.length === 1 ? 'boarding house' : 'boarding houses'}
          {showDistance && ` · distances from ${origin.label}`}
        </p>
        <div className="btn-group btn-group-sm" role="group" aria-label="Results view">
          {[
            ['grid', 'Grid', LayoutGrid],
            ['map', 'Map', MapIcon],
          ].map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setFilter('view', value === 'map' ? 'map' : '')}
              className={`btn ${view === value ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && view === 'map' ? (
        <ResultsMap listings={results} distanceOf={distanceOf} originLabel={origin.label} myLocation={filters.from === 'me' ? position : null} />
      ) : results.length > 0 ? (
        <div className="row g-4 stagger">
          {results.map((listing) => (
            <div key={listing.id} className="col-sm-6 col-xl-4">
              <RoomCard
                listing={listing}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={toggleFavorite}
                distance={showDistance ? `${formatDistance(distanceOf(listing))} from ${origin.label}` : null}
              />
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
