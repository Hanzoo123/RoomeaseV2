import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, DoorOpen, Phone, Receipt } from 'lucide-react'
import { publicUrl } from '../../config/base'
import { useData } from '../../context/DataContext'
import PageHero from './PageHero'

// The team, in the order the capstone paper lists them (from the PHP version's About page).
const TEAM = ['James Andrew P. Angcay', 'David Kristoff Corpuz', 'Christian Peter Dave D. Gatoc', 'Hanz Christian Lingatong', 'Ram Tomada']

// Each value names something the site actually does, not a slogan.
const VALUES = [
  { icon: BadgeCheck, title: 'Checked before it is shown', body: 'An administrator reviews every new listing before boarders can see it. A listing that turns out to be wrong comes down the same way.' },
  { icon: Receipt, title: 'The rent, up front', body: 'Every listing carries its monthly rent, with the house rules and what is included beside it, so nothing has to be asked before deciding whether to visit.' },
  { icon: DoorOpen, title: 'Slots, counted', body: 'Landlords update their open rooms and slots as boarders move in or out, so a listing shows what is free now instead of last semester.' },
  { icon: Phone, title: 'The landlord, directly', body: 'Boarders request a room, message the landlord or call the number on the listing. RoomEase takes no fee or payment, and the landlord decides.' },
]

// First and last name, so "David Kristoff Corpuz" is DC.
function initials(name) {
  const words = name.split(/\s+/).filter(Boolean)
  return (words[0][0] + words.at(-1)[0]).toUpperCase()
}

function Figure({ value, label }) {
  return (
    <div className="card shadow figure-card">
      <div className="card-body p-3">
        <p className="h3 fw-bold text-primary mb-0">{value}</p>
        <p className="small text-body-secondary mb-0">{label}</p>
      </div>
    </div>
  )
}

export default function About() {
  const { publicListings } = useData()
  const openRooms = publicListings.reduce((sum, listing) => sum + listing.availableRooms, 0)
  const housesWithRooms = publicListings.filter((listing) => listing.availableRooms > 0).length

  return (
    <div className="page-enter">
      <PageHero title="About RoomEase" lede="A boarding house directory for Baybay City, built so a room can be compared before it is visited." image={publicUrl('images/pages/about-header.webp')} />

      <section className="py-5">
        <div className="container py-lg-4">
          <div className="row g-4 g-lg-5 align-items-center">
            <div className="col-lg-6">
              {/* Atmosphere only, so the photos are skipped by screen readers; the figure is read as text. */}
              <div className="photo-stack">
                <img src={publicUrl('images/pages/about-story-1.webp')} alt="" className="photo-back" loading="lazy" />
                <img src={publicUrl('images/pages/about-story-2.webp')} alt="" className="photo-front" loading="lazy" />
                <Figure value="16 of 19" label="had visited or called a boarding house only to find no room free" />
              </div>
            </div>
            <div className="col-lg-6">
              <p className="text-primary fw-semibold small text-uppercase mb-2" style={{ letterSpacing: '0.08em' }}>
                Why we built it
              </p>
              <h2 className="h1 fw-bold tracking-tight">No more wasted trips</h2>
              <p className="text-body-secondary mt-3">
                Looking for a room in Baybay City usually means scrolling Facebook groups, asking friends, or walking street by street. When we surveyed nineteen people who had done it, most had found
                the rent missing from the post, and nearly all of them had made the trip, or the call, only to hear the rooms were already taken.
              </p>
              <p className="text-body-secondary">
                RoomEase puts that information in one place: what a room costs, what it includes, where it is, whether a slot is free, and how to reach the person who owns it.
              </p>
              <div className="row g-3 mt-2">
                <div className="col-sm-6">
                  <div className="fact-tile h-100">
                    <p className="h4 fw-bold text-primary mb-0">11 of 19</p>
                    <p className="small text-body-secondary mb-0">found the rent missing or unclear in the post</p>
                  </div>
                </div>
                {openRooms > 0 && (
                  <div className="col-sm-6">
                    <div className="fact-tile h-100">
                      <p className="h4 fw-bold text-primary mb-0">{openRooms} rooms</p>
                      <p className="small text-body-secondary mb-0">
                        available on RoomEase right now, in {housesWithRooms} boarding {housesWithRooms === 1 ? 'house' : 'houses'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-body border-top border-bottom">
        <div className="container py-lg-4">
          <div className="row g-4 g-lg-5">
            <div className="col-lg-4">
              <p className="text-primary fw-semibold small text-uppercase mb-2" style={{ letterSpacing: '0.08em' }}>
                Our mission
              </p>
              <p className="fs-5 fw-medium mb-0">
                To move the search for a boarding house in Baybay City out of scattered posts and word of mouth, into one place where landlords keep their listings current and boarders can see the
                rent, the rooms, the rules and the landlord’s number before they make the trip.
              </p>
            </div>
            <div className="col-lg-8">
              <p className="text-primary fw-semibold small text-uppercase mb-3" style={{ letterSpacing: '0.08em' }}>
                What we stand for
              </p>
              <div className="row g-3 stagger">
                {VALUES.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="col-sm-6">
                    <div className="card h-100">
                      <div className="card-body p-4">
                        <span className="icon-tile">
                          <Icon size={20} aria-hidden="true" />
                        </span>
                        <h3 className="h6 fw-semibold mt-3 mb-2">{title}</h3>
                        <p className="small text-body-secondary mb-0">{body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container py-lg-4 text-center" style={{ maxWidth: '46rem' }}>
          <p className="text-primary fw-semibold small text-uppercase mb-3" style={{ letterSpacing: '0.08em' }}>
            Our vision
          </p>
          <blockquote className="mb-3">
            <p className="h2 fw-bold tracking-tight mb-0">“A Baybay City where no one walks to a boarding house only to learn the rooms are gone.”</p>
          </blockquote>
          <p className="text-body-secondary mb-0">Where boarders can compare rooms honestly, and landlords can fill them without the guesswork.</p>
        </div>
      </section>

      <section className="pb-5">
        <div className="container pb-lg-4">
          <div className="text-center mx-auto mb-4" style={{ maxWidth: '40rem' }}>
            <h2 className="h3 fw-bold tracking-tight">Who built it</h2>
            <p className="text-body-secondary mb-0">RoomEase is a capstone project by five students of the College of Information Technology, for ITE 303: System Analysis and Design.</p>
          </div>
          <ul className="list-unstyled d-flex flex-wrap justify-content-center gap-3 mb-0">
            {TEAM.map((name) => (
              <li key={name} className="card team-card text-center">
                <div className="card-body p-3">
                  <span className="avatar avatar-lg avatar-soft mx-auto" aria-hidden="true">
                    {initials(name)}
                  </span>
                  <p className="small fw-semibold mt-2 mb-0">{name}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pb-5">
        <div className="container">
          <div className="page-hero rounded-4 p-4 p-md-5">
            <img src={publicUrl('images/pages/about-cta.webp')} alt="" loading="lazy" />
            <div style={{ maxWidth: '32rem' }}>
              <h2 className="h2 fw-bold mb-2">Find a room in Baybay City</h2>
              <p className="text-white text-opacity-75 mb-4">Search by barangay, room type and budget, and see what is free before you go.</p>
              <Link to="/rooms" className="btn btn-light btn-lg text-primary fw-semibold">
                Find a place to stay
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
