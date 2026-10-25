import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChartColumn,
  CircleCheck,
  MapPin,
  Menu,
  MessageCircle,
  Quote,
  Scale,
  Search,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { AREAS, availabilityOf, distanceKm, formatDistance, formatPeso, LOCATIONS, VSU_COORDS } from '../data/mockData'
import StreetArt from '../components/illustrations/StreetArt'
import { RatingBadge, Stars } from '../components/reviews/Stars'
import { ListingImage, Tag } from '../components/ui'
import { ThemeToggle } from '../components/ui/feedback'
import Logo from '../components/ui/Logo'

const YEAR = new Date().getFullYear()

const NAV_LINKS = [
  ['#features', 'Features'],
  ['#rooms', 'Rooms'],
  ['#how-it-works', 'How it works'],
  ['#areas', 'Areas'],
  ['#faq', 'FAQ'],
]

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
  ['Do I pay when I send a reservation request?', 'No. A request only asks the landlord to hold a room. You arrange payment directly with the landlord after approval.'],
  ['Can I list more than one boarding house?', 'Yes. Landlords can add as many properties as they manage and track each one separately.'],
  ['Which areas are covered?', `Baybay City, Leyte, including ${AREAS.join(', ')}.`],
]

function LandingNav() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <nav className="navbar navbar-expand-lg sticky-top topbar border-bottom" aria-label="Main">
      <div className="container">
        <Link to="/" className="navbar-brand py-0" aria-label="RoomEase home">
          <Logo tone="dark" />
        </Link>
        <div className="d-flex align-items-center gap-1 d-lg-none">
          <ThemeToggle />
          <button className="icon-btn" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="landing-nav" aria-label="Toggle navigation">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <div id="landing-nav" className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto gap-lg-2 py-2 py-lg-0">
            {NAV_LINKS.map(([href, label]) => (
              <li key={href} className="nav-item">
                <a className="nav-link small fw-medium" href={href} onClick={() => setOpen(false)}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-2 pb-3 pb-lg-0">
            <span className="d-none d-lg-inline-flex">
              <ThemeToggle />
            </span>
            {user ? (
              <Link to={`/${user.role}`} className="btn btn-primary">
                Go to dashboard
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-secondary">
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

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
        navigate(`/boarder/browse${params.size ? `?${params}` : ''}`)
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
        <Link to={`/boarder/rooms/${listing.id}`} className="btn btn-outline-primary w-100 mt-auto">
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

function Footer() {
  return (
    <footer className="bg-sidebar-gradient text-white pt-5 pb-4">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <Logo tagline="Find Your Perfect Room" />
            <p className="small text-white text-opacity-75 mt-3 mb-0" style={{ maxWidth: '20rem' }}>
              Helping students and workers in Baybay City find safe, affordable boarding houses, and helping landlords fill them.
            </p>
          </div>
          {[
            ['For boarders', [['/boarder/browse', 'Browse rooms'], ['/signup', 'Create an account'], ['/login', 'Sign in']]],
            ['For landlords', [['/signup', 'List your property'], ['/landlord/analytics', 'Landlord analytics'], ['/login', 'Landlord sign in']]],
          ].map(([heading, links]) => (
            <div key={heading} className="col-6 col-lg-2">
              <h2 className="small fw-semibold text-uppercase text-white text-opacity-75 mb-3" style={{ letterSpacing: '0.06em' }}>
                {heading}
              </h2>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                {links.map(([to, label]) => (
                  <li key={label}>
                    <Link to={to} state={heading === 'For landlords' ? { role: 'landlord' } : undefined} className="link-light link-opacity-75 link-opacity-100-hover text-decoration-none">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-lg-4">
            <h2 className="small fw-semibold text-uppercase text-white text-opacity-75 mb-3" style={{ letterSpacing: '0.06em' }}>
              Contact
            </h2>
            <p className="small text-white text-opacity-75 mb-1">hello@roomease.ph</p>
            <p className="small text-white text-opacity-75 mb-0">Baybay City, Leyte, Philippines</p>
          </div>
        </div>
        <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 border-top border-white border-opacity-10 pt-4 mt-5 text-xs text-white text-opacity-50">
          <span>© {YEAR} RoomEase. All rights reserved.</span>
          <span>Privacy Policy · Terms & Conditions</span>
        </div>
      </div>
    </footer>
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
  }
  const testimonials = publicReviews.filter((item) => item.rating === 5).slice(0, 3)

  return (
    <div data-theme="boarder" className="landing">
      <a href="#main" className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-primary z-3">
        Skip to content
      </a>
      <LandingNav />
      <Hero stats={stats} />

      <main id="main">
        <section aria-label="RoomEase in numbers" className="container">
          <div className="card stats-strip shadow">
            <div className="row g-0 text-center">
              {[
                [stats.houses, 'Approved boarding houses'],
                [stats.rooms, 'Rooms available now'],
                [stats.reviews, 'Verified reviews'],
                [AREAS.length, 'Areas in Baybay City'],
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
              <Link to="/boarder/browse" className="btn btn-outline-secondary align-self-start align-self-md-auto">
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

        <HowItWorks />

        <section id="areas" className="py-5">
          <div className="container py-lg-4">
            <SectionTitle eyebrow="Areas" title="Popular places to stay" body="From walking distance to campus to the heart of the city." />
            <div className="row g-4">
              {LOCATIONS.map((location) => {
                const count = publicListings.filter((listing) => listing.area === location.name).length
                return (
                  <div key={location.id} className="col-6 col-lg-3">
                    <Link to={`/boarder/browse?location=${encodeURIComponent(location.name)}`} className="card h-100 p-2 text-reset-link hover-zoom card-hover">
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
              <Link to="/boarder/browse" className="btn btn-outline-secondary btn-lg">
                Browse rooms
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
