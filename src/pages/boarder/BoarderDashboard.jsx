import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AirVent, ArrowRight, BedDouble, BedSingle, Bell, CalendarDays, ChevronDown, Heart, MapPin, Search, SearchX, Users, Wifi } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { BOARDER_SUMMARY, LOCATIONS, ROOM_TYPES, availabilityOf, formatPeso } from '../../data/mockData'
import { CtaHouseArt } from '../../components/illustrations/BrandArt'
import RoomArt from '../../components/illustrations/RoomArt'
import StreetArt from '../../components/illustrations/StreetArt'
import { ListingImage, SectionHeader, StatCard, Tag, WelcomeBanner } from '../../components/ui'

const FEATURE_ICONS = { 'Single Room': BedSingle, 'Shared Room': BedDouble, 'Wi-Fi': Wifi, Aircon: AirVent }

const DEFAULT_FILTERS = { location: 'all', min: '1000', max: '10000', roomType: 'any' }

const digitsOnly = (value) => value.replace(/\D/g, '').slice(0, 6)
const withCommas = (digits) => (digits ? Number(digits).toLocaleString('en-PH') : '')

function matchesFilters(listing, filters) {
  if (filters.location !== 'all' && listing.area !== filters.location) return false
  if (filters.min && listing.price < Number(filters.min)) return false
  if (filters.max && listing.price > Number(filters.max)) return false
  if (filters.roomType !== 'any' && listing.roomType !== filters.roomType) return false
  return true
}

function SelectBox({ label, showLabel = true, icon: Icon, value, onChange, children }) {
  return (
    <label className="relative flex h-14 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
      {Icon && <Icon className="size-4 shrink-0 text-muted" aria-hidden="true" />}
      <span className="flex min-w-0 flex-1 flex-col">
        {showLabel && <span className="text-[11px] text-muted">{label}</span>}
        <select
          value={value}
          onChange={onChange}
          aria-label={label}
          className="w-full appearance-none bg-transparent pr-6 text-sm font-medium outline-none"
        >
          {children}
        </select>
      </span>
      <ChevronDown className="pointer-events-none absolute right-3.5 size-4 text-muted" aria-hidden="true" />
    </label>
  )
}

function RentBox({ label, value, onChange }) {
  return (
    <label className="flex h-14 flex-col justify-center rounded-xl border border-line bg-white px-3.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="flex items-center text-sm font-semibold">
        ₱
        <input
          inputMode="numeric"
          value={withCommas(value)}
          onChange={(event) => onChange(digitsOnly(event.target.value))}
          placeholder="Any"
          className="w-full bg-transparent pl-0.5 outline-none placeholder:font-normal placeholder:text-muted/70"
        />
      </span>
    </label>
  )
}

function SearchPanel({ onSearch }) {
  const [form, setForm] = useState(DEFAULT_FILTERS)
  const [error, setError] = useState('')
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  function handleSubmit(event) {
    event.preventDefault()
    if (form.min && form.max && Number(form.min) > Number(form.max)) {
      setError('Min rent can’t be higher than max rent.')
      return
    }
    setError('')
    onSearch(form)
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
          <SelectBox label="Location" showLabel={false} icon={MapPin} value={form.location} onChange={(event) => update('location')(event.target.value)}>
            <option value="all">Baybay City</option>
            {LOCATIONS.map((location) => (
              <option key={location.id} value={location.name}>
                {location.name}
              </option>
            ))}
          </SelectBox>
          <RentBox label="Min Rent" value={form.min} onChange={update('min')} />
          <RentBox label="Max Rent" value={form.max} onChange={update('max')} />
          <SelectBox label="Room Type" value={form.roomType} onChange={(event) => update('roomType')(event.target.value)}>
            <option value="any">Any Type</option>
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

function RoomCard({ listing, isFavorite, onToggleFavorite }) {
  const features = [listing.roomType, ...listing.amenities]
  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <ListingImage listing={listing} kind="room" className="absolute inset-0 size-full" />
        <Tag className="absolute top-3 left-3 shadow-sm">{availabilityOf(listing)}</Tag>
        <button
          type="button"
          onClick={() => onToggleFavorite(listing.id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${listing.name} from favorites` : `Save ${listing.name} to favorites`}
          className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-white shadow-md transition-transform hover:scale-105"
        >
          <Heart className={`size-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-ink'}`} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{listing.name}</h3>
        <p className="mt-0.5 text-sm text-muted">
          {listing.area}, {listing.city}
        </p>
        <p className="mt-3 text-sm text-muted">
          <span className="text-lg font-bold text-ink">{formatPeso(listing.price)}</span> / month
        </p>
        <ul className="mt-3 mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
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
        <Link to={`/boarder/browse?listing=${listing.id}`} className="btn-primary mt-auto w-full">
          View Details
        </Link>
      </div>
    </article>
  )
}

export default function BoarderDashboard() {
  const { user } = useAuth()
  const { listings, favorites, toggleFavorite } = useData()
  const [filters, setFilters] = useState(null)

  const results = filters ? listings.filter((listing) => matchesFilters(listing, filters)) : listings

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title={`Welcome back, ${user.firstName}!`}
        subtitle="Find your next place to stay in Baybay City."
        art={<RoomArt variant="single" className="size-full" />}
      />

      <SearchPanel onSearch={setFilters} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Heart} value={favorites.length} label="Saved Listings" iconClassName="fill-red-500 text-red-500" />
        <StatCard icon={CalendarDays} value={BOARDER_SUMMARY.reservations} label="Reservations" iconClassName="text-accent" />
        <StatCard icon={Bell} value={BOARDER_SUMMARY.notifications} label="Notifications" iconClassName="text-amber-500" />
        <StatCard icon={Users} value={BOARDER_SUMMARY.recentlyViewed} label="Recently Viewed" iconClassName="text-sky-500" />
      </div>

      <section>
        <SectionHeader
          title={filters ? `Search results (${results.length})` : 'Recommended for You'}
          actionTo="/boarder/browse"
          action={
            filters && (
              <button type="button" onClick={() => setFilters(null)} className="text-sm font-medium text-accent hover:underline">
                Clear search
              </button>
            )
          }
        />
        {results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((listing) => (
              <RoomCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center px-6 py-10 text-center">
            <SearchX className="size-8 text-muted" aria-hidden="true" />
            <p className="mt-3 font-semibold">No boarding houses match your search</p>
            <p className="mt-1 text-sm text-muted">Try another location or widen your budget.</p>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Popular Locations" actionTo="/boarder/browse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {LOCATIONS.map((location) => (
            <Link key={location.id} to={`/boarder/browse?location=${location.id}`} className="card group overflow-hidden p-2.5">
              <div className="aspect-[16/10] overflow-hidden rounded-xl">
                <StreetArt variant={location.art} className="size-full transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex items-start gap-2 px-1 pt-3 pb-1">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">{location.name}</p>
                  <p className="text-xs text-muted">{location.listings} listings</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-6 rounded-2xl border border-accent/15 bg-gradient-to-r from-accent-soft to-[#f5f8ff] p-6 sm:flex-row sm:p-8">
        <CtaHouseArt className="w-40 shrink-0 sm:w-44" />
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold tracking-tight">Need a place to stay?</h2>
          <p className="mt-1 text-sm text-muted">Browse thousands of boarding houses in Baybay City.</p>
          <Link to="/boarder/browse" className="btn-primary mt-4">
            Browse All Rooms
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
