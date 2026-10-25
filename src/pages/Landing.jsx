import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChartColumn,
  CircleCheck,
  CircleDashed,
  CircleX,
  MapPin,
  MessageCircle,
  Quote,
  Scale,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { AREAS, availabilityOf, distanceKm, formatDistance, formatPeso, LOCATIONS, ROOM_TYPE_INFO, ROOM_TYPES, VSU_COORDS } from '../data/mockData'
import StreetArt from '../components/illustrations/StreetArt'
import { RatingBadge, Stars } from '../components/reviews/Stars'
import { ListingImage, Tag } from '../components/ui'

const FEATURES = [
  { icon: Search, title: 'Search & map', body: 'Filter by area, budget, room type and amenities, then see every house on a map with prices.' },
  { icon: Star, title: 'Verified reviews', body: 'Only boarders who actually stayed can rate a place, so ratings reflect real experiences.' },
  { icon: Scale, title: 'Compare side by side', body: 'Put up to three rooms next to each other to compare rent, distance to VSU and amenities.' },
  { icon: MessageCircle, title: 'Chat with landlords', body: 'Ask about curfews, bills or visits without sharing your number until you’re ready.' },
  { icon: CalendarCheck, title: 'Reserve online', body: 'Send a reservation request with your move-in date and get notified the moment it’s approved.' },
  { icon: ChartColumn, title: 'Landlord dashboard', body: 'Landlords track availability, requests, reviews and listing views in one place.' },
]

const STEPS = {
  boarder: [
    ['Search', 'Browse approved boarding houses by location, budget and amenities, or explore the map.'],
    ['Compare & ask', 'Shortlist favorites, compare them side by side and message landlords with questions.'],
    ['Reserve', 'Send a request with your move-in date. You’ll be notified when the landlord approves.'],
  ],
  landlord: [
    ['List your house', 'Add photos, rooms, rent and a map pin. Our team reviews each listing for quality and safety.'],
    ['Get requests', 'Boarders find you, message you and send reservation requests with their move-in dates.'],
    ['Manage it all', 'Approve requests, update room availability and see how your listings perform.'],
  ],
}

const FAQS = [
  ['Is RoomEase free for boarders?', 'Yes. Searching, saving, messaging and sending reservation requests are all free for boarders.'],
  ['How are listings checked?', 'Every new listing is reviewed by an admin before boarders can see it. Reviews can only be written by boarders with an approved stay.'],
  ['Do I need an account to look at rooms?', 'No. Anyone can open Find Place to Stay and every listing. An account is only needed to save rooms, send a request or message a landlord.'],
  ['Do I pay when I send a reservation request?', 'No. A request only asks the landlord to hold a room. You arrange payment directly with the landlord after approval.'],
  ['Can I list more than one boarding house?', 'Yes. Landlords can add as many properties as they manage and track each one separately.'],
  ['Which areas are covered?', `Baybay City, Leyte, including ${AREAS.join(', ')}.`],
]

function HeroSearch() {
  const navigate = useNavigate()
  const [location, setLocation] = useState('')
  const [budget, setBudget] = useState('')

  return (
    <form
      className="card hero-search p-2 mt-4"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const params = new URLSearchParams(Object.entries({ location, max: budget }).filter(([, value]) => value))
        navigate(`/rooms${params.size ? `?${params}` : ''}`)
      }}
    >
      <div className="row g-2 align-items-center">
        <div className="col-sm">
          <label className="filter-box border-0 h-auto py-2">
            <MapPin size={18} className="text-primary flex-shrink-0" aria-hidden="true" />
            <span className="d-flex flex-column flex-grow-1">
              <span className="filter-label">Where</span>
              <select value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Location">
                <option value="">Anywhere</option>
                {AREAS.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </select>
            </span>
          </label>
        </div>
        <div className="col-sm border-start-sm">
          <label className="filter-box border-0 h-auto py-2">
            <span className="text-primary fw-bold flex-shrink-0" aria-hidden="true">
              ₱
            </span>
            <span className="d-flex flex-column flex-grow-1">
              <span className="filter-label">Monthly budget</span>
              <select value={budget} onChange={(event) => setBudget(event.target.value)} aria-label="Monthly budget">
                <option value="">Any budget</option>
                <option value="2000">Up to ₱2,000</option>
                <option value="3000">Up to ₱3,000</option>
                <option value="4000">Up to ₱4,000</option>
              </select>
            </span>
          </label>
        </div>
        <div className="col-sm-auto">
          <button type="submit" className="btn btn-primary w-100 px-4" style={{ height: '3rem' }}>
            <Search size={18} aria-hidden="true" />
            Search rooms
          </button>
        </div>
      </div>
    </form>
  )
}

function Hero({ stats }) {
  return (
    <header className="hero bg-sidebar-gradient text-white position-relative overflow-hidden">
      <div className="container py-5">
        <div className="row align-items-center g-5 py-lg-4">
          <div className="col-lg-6">
            <span className="badge rounded-pill bg-white bg-opacity-10 border border-white border-opacity-25 fw-medium px-3 py-2 mb-3">
              <MapPin size={14} className="me-1" aria-hidden="true" />
              Baybay City, Leyte
            </span>
            <h1 className="display-4 fw-bold tracking-tight lh-sm">Find a boarding house that feels like home.</h1>
            <p className="lead text-white text-opacity-75 mt-3 mb-0">
              Compare rooms near VSU and the town center, read reviews from real boarders, and reserve online in minutes.
            </p>
            <HeroSearch />
            <div className="d-flex flex-wrap align-items-center gap-3 mt-4 small text-white text-opacity-75">
              <span className="d-inline-flex align-items-center gap-1">
                <Star size={16} className="text-warning" fill="currentColor" aria-hidden="true" />
                <strong className="text-white">{stats.rating.toFixed(1)}</strong> average rating
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="text-white">{stats.reviews}</strong> verified reviews
              </span>
              <span aria-hidden="true">·</span>
              <span>Free for boarders</span>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="hero-art position-relative mx-auto">
              <div className="ratio rounded-4 overflow-hidden shadow-lg border border-white border-opacity-25" style={{ '--bs-aspect-ratio': '72%' }}>
                <StreetArt variant={0} />
              </div>
              <div className="floating-card card shadow float-a">
                <div className="card-body py-2 px-3 d-flex align-items-center gap-2">
                  <CircleCheck size={22} className="text-success flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="small fw-semibold text-body mb-0">Reservation approved</p>
                    <p className="text-2xs text-body-secondary mb-0">City View Boarding House</p>
                  </div>
                </div>
              </div>
              <div className="floating-card card shadow float-b">
                <div className="card-body py-2 px-3">
                  <Stars value={5} size={14} />
                  <p className="small fw-semibold text-body mb-0 mt-1">“Five minutes to VSU”</p>
                  <p className="text-2xs text-body-secondary mb-0">Kim · Green Haven</p>
                </div>
              </div>
              <div className="floating-card card shadow float-c">
                <div className="card-body py-2 px-3 d-flex align-items-center gap-2">
                  <span className="icon-circle bg-primary text-white" style={{ width: '2rem', height: '2rem' }}>
                    <MapPin size={14} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="small fw-bold text-body mb-0">₱2,800 / month</p>
                    <p className="text-2xs text-body-secondary mb-0">298 m to VSU</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function PublicRoomCard({ listing, rating }) {
  return (
    <article className="card h-100 overflow-hidden card-hover">
      <div className="position-relative">
        <div className="ratio" style={{ '--bs-aspect-ratio': '62.5%' }}>
          <ListingImage listing={listing} kind="room" />
        </div>
        <Tag className="position-absolute top-0 start-0 m-3 shadow-sm">{availabilityOf(listing)}</Tag>
      </div>
      <div className="card-body d-flex flex-column">
        <h3 className="fs-6 fw-semibold mb-1">{listing.name}</h3>
        <p className="small text-body-secondary mb-1">
          {listing.area} · {formatDistance(distanceKm(listing.coords, VSU_COORDS))} to VSU
        </p>
        <RatingBadge rating={rating} className="mb-2" />
        <p className="small text-body-secondary mb-3">
          <span className="fs-5 fw-bold text-body">{formatPeso(listing.price)}</span> / month
        </p>
        <Link to={`/rooms/${listing.id}`} className="btn btn-outline-primary w-100 mt-auto">
          View details
        </Link>
      </div>
    </article>
  )
}

function SectionTitle({ eyebrow, title, body }) {
  return (
    <div className="text-center mx-auto mb-5" style={{ maxWidth: '40rem' }}>
      <p className="text-primary fw-semibold small text-uppercase mb-2" style={{ letterSpacing: '0.08em' }}>
        {eyebrow}
      </p>
      <h2 className="h1 fw-bold tracking-tight">{title}</h2>
      {body && <p className="text-body-secondary mb-0 mt-2">{body}</p>}
    </div>
  )
}

function HowItWorks() {
  const [audience, setAudience] = useState('boarder')
  return (
    <section id="how-it-works" className="py-5 bg-body border-top border-bottom">
      <div className="container py-lg-4">
        <SectionTitle eyebrow="How it works" title="Three steps to your next room" />
        <div className="d-flex justify-content-center mb-5">
          <div className="bg-page border rounded-pill p-1">
            <ul className="nav nav-pills gap-1" role="tablist" aria-label="Audience">
              {[
                ['boarder', 'For boarders'],
                ['landlord', 'For landlords'],
              ].map(([value, label]) => (
                <li key={value} className="nav-item">
                  <button type="button" role="tab" aria-selected={audience === value} className={`nav-link rounded-pill px-4 ${audience === value ? 'active' : ''}`} onClick={() => setAudience(value)}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <ol key={audience} className="row g-4 list-unstyled mb-0 stagger">
          {STEPS[audience].map(([title, body], index) => (
            <li key={title} className="col-md-4">
              <div className="text-center px-lg-3">
                <span className="step-number">{index + 1}</span>
                <h3 className="h5 fw-semibold mt-3">{title}</h3>
                <p className="text-body-secondary small mb-0">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="py-5">
      <div className="container py-lg-4" style={{ maxWidth: '48rem' }}>
        <SectionTitle eyebrow="FAQ" title="Questions, answered" />
        <div className="accordion">
          {FAQS.map(([question, answer], index) => {
            const expanded = open === index
            return (
              <div key={question} className="accordion-item">
                <h3 className="accordion-header">
                  <button
                    type="button"
                    className={`accordion-button fw-semibold ${expanded ? '' : 'collapsed'}`}
                    aria-expanded={expanded}
                    aria-controls={`faq-${index}`}
                    onClick={() => setOpen(expanded ? -1 : index)}
                  >
                    {question}
                  </button>
                </h3>
                <div id={`faq-${index}`} className={`accordion-collapse collapse ${expanded ? 'show' : ''}`}>
                  <div className="accordion-body text-body-secondary">{answer}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Photo tiles for the five room types, each opening Find Place to Stay filtered to that type.
function RoomTypes({ listings }) {
  return (
    <section id="room-types" className="pb-5">
      <div className="container pb-lg-4">
        <SectionTitle eyebrow="By room type" title="Pick the kind of room you want" body="From a room of your own to a bed in a shared dorm, sorted the way boarders ask for them." />
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3">
          {ROOM_TYPES.map((type) => {
            const count = listings.filter((listing) => listing.roomType === type).length
            return (
              <div key={type} className="col">
                <Link to={`/rooms?roomType=${encodeURIComponent(type)}`} className="room-type-tile card h-100 overflow-hidden text-reset-link card-hover">
                  <div className="ratio ratio-4x3">
                    <img src={ROOM_TYPE_INFO[type].photo} alt="" loading="lazy" />
                  </div>
                  <div className="card-body p-3">
                    <p className="fw-semibold mb-0">{type}</p>
                    <p className="text-xs text-body-secondary mb-1">{ROOM_TYPE_INFO[type].blurb}</p>
                    <p className="text-xs fw-medium text-primary mb-0">
                      {count ? `${count} ${count === 1 ? 'house' : 'houses'}` : 'None listed yet'}
                    </p>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// The three states a landlord sees on a listing after submitting it.
function ReviewSteps() {
  const steps = [
    { icon: CircleDashed, label: 'In review', body: 'An admin checks it first' },
    { icon: CircleCheck, label: 'Live', body: 'Boarders can find it' },
    { icon: CircleX, label: 'Needs changes', body: 'You see why, fix it and resubmit' },
  ]
  return (
    <ol className="review-steps list-unstyled d-flex flex-wrap gap-2 mt-4 mb-0" aria-label="How a new listing is reviewed">
      {steps.map(({ icon: Icon, label, body }) => (
        <li key={label} className="review-step d-flex align-items-center gap-2">
          <Icon size={16} className="flex-shrink-0" aria-hidden="true" />
          <span>
            <span className="d-block small fw-semibold">{label}</span>
            <span className="d-block text-2xs text-white text-opacity-75">{body}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export default function Landing() {
  const { publicListings, reviews, ratingOf, listingById } = useData()

  const ratedListings = [...publicListings].sort((a, b) => ratingOf(b.id).average - ratingOf(a.id).average)
  const featured = ratedListings.slice(0, 3)
  const publicIds = new Set(publicListings.map((listing) => listing.id))
  const publicReviews = reviews.filter((item) => publicIds.has(item.listingId))
  const stats = {
    houses: publicListings.length,
    rooms: publicListings.reduce((sum, listing) => sum + listing.availableRooms, 0),
    reviews: publicReviews.length,
    rating: publicReviews.length ? publicReviews.reduce((sum, item) => sum + item.rating, 0) / publicReviews.length : 0,
    // What it costs to move in somewhere today, not the cheapest full house.
    lowestOpen: Math.min(...publicListings.filter((listing) => listing.availableRooms > 0).map((listing) => listing.price)),
  }
  const testimonials = publicReviews.filter((item) => item.rating === 5).slice(0, 3)

  return (
    <>
      <Hero stats={stats} />

      <div>
        <section aria-label="RoomEase in numbers" className="container">
          <div className="card stats-strip shadow">
            <div className="row g-0 text-center">
              {[
                [stats.houses, 'Approved boarding houses'],
                [stats.rooms, 'Rooms available now'],
                [Number.isFinite(stats.lowestOpen) ? formatPeso(stats.lowestOpen) : '—', 'Lowest monthly rent with a free slot'],
                [stats.reviews, 'Verified reviews'],
              ].map(([value, label]) => (
                <div key={label} className="col-6 col-md-3 py-4 px-2">
                  <p className="display-6 fw-bold text-primary mb-0">{value}</p>
                  <p className="small text-body-secondary mb-0">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-5">
          <div className="container py-lg-4">
            <SectionTitle eyebrow="Features" title="Everything you need to find the right room" body="Built for boarders and landlords in Baybay City, from the first search to move-in day." />
            <div className="row g-4 stagger">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="col-md-6 col-lg-4">
                  <div className="card h-100 card-hover">
                    <div className="card-body p-4">
                      <span className="icon-tile">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <h3 className="h6 fw-semibold mt-3 mb-2">{title}</h3>
                      <p className="small text-body-secondary mb-0">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="rooms" className="pb-5">
          <div className="container pb-lg-4">
            <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">
              <div>
                <p className="text-primary fw-semibold small text-uppercase mb-2" style={{ letterSpacing: '0.08em' }}>
                  Top rated
                </p>
                <h2 className="h1 fw-bold tracking-tight mb-0">Boarders’ favorites right now</h2>
              </div>
              <Link to="/rooms" className="btn btn-outline-secondary align-self-start align-self-md-auto">
                See all rooms
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="row g-4">
              {featured.map((listing) => (
                <div key={listing.id} className="col-md-6 col-lg-4">
                  <PublicRoomCard listing={listing} rating={ratingOf(listing.id)} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <RoomTypes listings={publicListings} />

        <HowItWorks />

        <section id="areas" className="py-5">
          <div className="container py-lg-4">
            <SectionTitle eyebrow="Areas" title="Popular places to stay" body="From walking distance to campus to the heart of the city." />
            <div className="row g-4">
              {LOCATIONS.map((location) => {
                const count = publicListings.filter((listing) => listing.area === location.name).length
                return (
                  <div key={location.id} className="col-6 col-lg-3">
                    <Link to={`/rooms?location=${encodeURIComponent(location.name)}`} className="card h-100 p-2 text-reset-link hover-zoom card-hover">
                      <div className="ratio rounded-3 overflow-hidden" style={{ '--bs-aspect-ratio': '70%' }}>
                        <StreetArt variant={location.art} />
                      </div>
                      <div className="px-2 pt-3 pb-2">
                        <p className="fw-semibold mb-0">{location.name}</p>
                        <p className="small text-body-secondary mb-0">
                          {count} {count === 1 ? 'boarding house' : 'boarding houses'}
                        </p>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {testimonials.length > 0 && (
          <section id="reviews" className="py-5 bg-body border-top border-bottom">
            <div className="container py-lg-4">
              <SectionTitle eyebrow="Reviews" title="What boarders say" body="Every review comes from a boarder with an approved stay." />
              <div className="row g-4">
                {testimonials.map((item) => (
                  <div key={item.id} className="col-md-4">
                    <figure className="card h-100 mb-0">
                      <div className="card-body p-4 d-flex flex-column">
                        <Quote size={28} className="text-primary opacity-50 mb-3" aria-hidden="true" />
                        <blockquote className="mb-4 flex-grow-1">
                          <p className="mb-0">{item.comment}</p>
                        </blockquote>
                        <figcaption className="d-flex align-items-center gap-3">
                          <span className="avatar avatar-soft">
                            {item.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')}
                          </span>
                          <span>
                            <span className="d-block small fw-semibold">{item.name}</span>
                            <span className="d-block text-xs text-body-secondary">{listingById(item.listingId)?.name}</span>
                          </span>
                          <Stars value={item.rating} className="ms-auto" />
                        </figcaption>
                      </div>
                    </figure>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-5" data-theme="landlord">
          <div className="container py-lg-3">
            <div className="cta-accent rounded-4 text-white p-4 p-md-5 d-flex flex-column flex-lg-row align-items-lg-center gap-4">
              <div className="flex-grow-1">
                <h2 className="h2 fw-bold mb-2">Own a boarding house in Baybay?</h2>
                <p className="text-white text-opacity-75 mb-3 mb-lg-0">List it for free, get reservation requests from verified boarders, and track everything from one dashboard.</p>
                <ul className="list-unstyled d-flex flex-wrap gap-3 small mt-3 mb-0">
                  {['Free to list', 'Admin-reviewed listings', 'Built-in analytics'].map((item) => (
                    <li key={item} className="d-flex align-items-center gap-1">
                      <BadgeCheck size={16} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <ReviewSteps />
              </div>
              <Link to="/signup" state={{ role: 'landlord' }} className="btn btn-light btn-lg text-primary fw-semibold flex-shrink-0">
                List your property
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <Faq />

        <section className="pb-5">
          <div className="container text-center">
            <ShieldCheck size={40} className="text-primary mb-3" aria-hidden="true" />
            <h2 className="h2 fw-bold tracking-tight">Ready to find your room?</h2>
            <p className="text-body-secondary mb-4">Create a free account in under a minute.</p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Get started
              </Link>
              <Link to="/rooms" className="btn btn-outline-secondary btn-lg">
                Find a place to stay
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
