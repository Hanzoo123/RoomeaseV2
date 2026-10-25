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
    <section className="card p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white">
          <Search className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Find a boarding house</h2>
          <p className="text-sm text-muted">Search by location, budget, or room type.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <SelectBox label="Location" showLabel={false} icon={MapPin} value={form.location} onChange={update('location')}>
            <option value="">Baybay City</option>
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </SelectBox>
          <RentBox label="Min Rent" value={form.min} onChange={update('min')} />
          <RentBox label="Max Rent" value={form.max} onChange={update('max')} />
          <SelectBox label="Room Type" value={form.roomType} onChange={update('roomType')}>
            <option value="">Any Type</option>
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectBox>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary mt-4 h-11 w-full">
          <Search className="size-4" aria-hidden="true" />
          Search
        </button>
      </form>
    </section>
  )
}

export default function BoarderDashboard() {
  const { user } = useAuth()
  const { publicListings, favorites, toggleFavorite, myReservations, recentlyViewed, counts } = useData()
  const recommended = publicListings.slice(0, 3)

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title={`Welcome back, ${user.firstName}!`}
        subtitle="Find your next place to stay in Baybay City."
        art={<RoomArt variant="single" className="size-full" />}
      />

      <SearchPanel />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Heart} value={favorites.length} label="Saved Listings" iconClassName="fill-red-500 text-red-500" />
        <StatCard icon={CalendarDays} value={myReservations.length} label="Reservations" iconClassName="text-accent" />
        <StatCard icon={Bell} value={counts.notifications} label="Notifications" iconClassName="text-amber-500" />
        <StatCard icon={Users} value={recentlyViewed.length} label="Recently Viewed" iconClassName="text-sky-500" />
      </div>

      <section>
        <SectionHeader title="Recommended for You" actionTo="/boarder/browse" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {recommended.map((listing) => (
            <RoomCard key={listing.id} listing={listing} isFavorite={favorites.includes(listing.id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Popular Locations" actionTo="/boarder/browse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {LOCATIONS.map((location) => {
            const count = publicListings.filter((listing) => listing.area === location.name).length
            return (
              <Link
                key={location.id}
                to={`/boarder/browse?location=${encodeURIComponent(location.name)}`}
                className="card group overflow-hidden p-2.5"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-xl">
                  <StreetArt variant={location.art} className="size-full transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="flex items-start gap-2 px-1 pt-3 pb-1">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">{location.name}</p>
                    <p className="text-xs text-muted">
                      {count} {count === 1 ? 'listing' : 'listings'}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col items-center gap-6 rounded-2xl border border-accent/15 bg-gradient-to-r from-accent-soft to-[#f5f8ff] p-6 sm:flex-row sm:p-8">
        <CtaHouseArt className="w-40 shrink-0 sm:w-44" />
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold tracking-tight">Need a place to stay?</h2>
          <p className="mt-1 text-sm text-muted">Browse boarding houses across Baybay City.</p>
          <Link to="/boarder/browse" className="btn-primary mt-4">
            Browse All Rooms
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
