import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, CalendarDays, Heart, MapPin, Search, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { AREAS, LOCATIONS, ROOM_TYPES } from '../../data/mockData'
import { CtaHouseArt } from '../../components/illustrations/BrandArt'
import RoomArt from '../../components/illustrations/RoomArt'
import StreetArt from '../../components/illustrations/StreetArt'
import RoomCard from '../../components/listings/RoomCard'
import { RentBox, SelectBox } from '../../components/listings/FilterFields'
import { SectionHeader, StatCard, WelcomeBanner } from '../../components/ui'

const DEFAULT_FILTERS = { location: '', min: '1000', max: '10000', roomType: '' }

// Turns the dashboard search into Browse Rooms query parameters.
function SearchPanel() {
  const navigate = useNavigate()
  const [form, setForm] = useState(DEFAULT_FILTERS)
  const [error, setError] = useState('')
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  function handleSubmit(event) {
    event.preventDefault()
    if (form.min && form.max && Number(form.min) > Number(form.max)) {
      setError('Min rent can’t be higher than max rent.')
      return
    }
    const params = new URLSearchParams(Object.entries(form).filter(([, value]) => value))
    navigate(`/boarder/browse?${params}`)
  }

  return (
    <section className="card">
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-3">
          <span className="icon-circle bg-primary text-white">
            <Search size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="h5 fw-semibold tracking-tight mb-0">Find a boarding house</h2>
            <p className="small text-body-secondary mb-0">Search by location, budget, or room type.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="row g-3">
            <div className="col-sm-6 col-lg-4">
              <SelectBox label="Location" showLabel={false} icon={MapPin} value={form.location} onChange={update('location')}>
                <option value="">Baybay City</option>
                {AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </SelectBox>
            </div>
            <div className="col-sm-6 col-lg">
              <RentBox label="Min Rent" value={form.min} onChange={update('min')} />
            </div>
            <div className="col-sm-6 col-lg">
              <RentBox label="Max Rent" value={form.max} onChange={update('max')} />
            </div>
            <div className="col-sm-6 col-lg">
              <SelectBox label="Room Type" value={form.roomType} onChange={update('roomType')}>
                <option value="">Any Type</option>
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectBox>
            </div>
          </div>
          {error && (
            <p role="alert" className="small text-danger mt-3 mb-0">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-100 mt-3" style={{ height: '2.75rem' }}>
            <Search size={16} aria-hidden="true" />
            Search
          </button>
        </form>
      </div>
    </section>
  )
}

export default function BoarderDashboard() {
  const { user } = useAuth()
  const { publicListings, favorites, toggleFavorite, myReservations, recentlyViewed, counts } = useData()
  const recommended = publicListings.slice(0, 3)

  return (
    <div className="d-flex flex-column gap-4">
      <WelcomeBanner title={`Welcome back, ${user.firstName}!`} subtitle="Find your next place to stay in Baybay City." art={<RoomArt variant="single" />} />

      <SearchPanel />

      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <StatCard icon={Heart} value={favorites.length} label="Saved Listings" iconClassName="text-danger" filled />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon={CalendarDays} value={myReservations.length} label="Reservations" iconClassName="text-primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon={Bell} value={counts.notifications} label="Notifications" iconClassName="text-warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon={Users} value={recentlyViewed.length} label="Recently Viewed" iconClassName="text-info" />
        </div>
      </div>

      <section>
        <SectionHeader title="Recommended for You" actionTo="/boarder/browse" />
        <div className="row g-4">
          {recommended.map((listing) => (
            <div key={listing.id} className="col-sm-6 col-xl-4">
              <RoomCard listing={listing} isFavorite={favorites.includes(listing.id)} onToggleFavorite={toggleFavorite} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Popular Locations" actionTo="/boarder/browse" />
        <div className="row g-3">
          {LOCATIONS.map((location) => {
            const count = publicListings.filter((listing) => listing.area === location.name).length
            return (
              <div key={location.id} className="col-6 col-md-3">
                <Link to={`/boarder/browse?location=${encodeURIComponent(location.name)}`} className="card h-100 p-2 text-reset-link hover-zoom">
                  <div className="ratio rounded-3 overflow-hidden" style={{ '--bs-aspect-ratio': '62.5%' }}>
                    <StreetArt variant={location.art} />
                  </div>
                  <div className="d-flex align-items-start gap-2 px-1 pt-3 pb-1">
                    <MapPin size={16} className="flex-shrink-0 mt-1 text-body" aria-hidden="true" />
                    <div>
                      <p className="small fw-semibold text-body mb-0">{location.name}</p>
                      <p className="text-xs text-body-secondary mb-0">
                        {count} {count === 1 ? 'listing' : 'listings'}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      <section className="cta-soft rounded-4 d-flex flex-column flex-sm-row align-items-center gap-4 p-4 p-sm-5">
        <CtaHouseArt className="flex-shrink-0" width={176} />
        <div className="text-center text-sm-start">
          <h2 className="h4 fw-bold tracking-tight mb-1">Need a place to stay?</h2>
          <p className="small text-body-secondary mb-3">Browse boarding houses across Baybay City.</p>
          <Link to="/boarder/browse" className="btn btn-primary">
            Browse All Rooms
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
