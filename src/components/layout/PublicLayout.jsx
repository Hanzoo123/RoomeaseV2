import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowRight, Mail, MapPin, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { PUBLIC_PATHS, SitePathsProvider } from '../../context/SitePaths'
import { CompareBar, useCompareBarVisible } from '../listings/CompareControls'
import { PageSkeleton, ThemeToggle } from '../ui/feedback'
import Logo from '../ui/Logo'

const YEAR = new Date().getFullYear()

// Same menu as the PHP site header.
export const PUBLIC_NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/rooms', label: 'Find Place to Stay' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
]

const FOOTER_COLUMNS = [
  {
    heading: 'For boarders',
    links: [
      { to: '/rooms', label: 'Find a place to stay' },
      { to: '/rooms?within=1', label: 'Rooms within 1 km of VSU' },
      { to: '/signup', label: 'Create an account' },
      { to: '/login', label: 'Sign in' },
    ],
  },
  {
    heading: 'For landlords',
    links: [
      { to: '/signup', label: 'List your property', state: { role: 'landlord' } },
      { to: '/login', label: 'Landlord sign in', state: { role: 'landlord' } },
      { to: '/contact#faq', label: 'How listings are reviewed' },
    ],
  },
  {
    heading: 'RoomEase',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/contact', label: 'Contact us' },
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms & Conditions' },
    ],
  },
]

function PublicNav() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <nav className="navbar navbar-expand-lg sticky-top topbar border-bottom" aria-label="Main">
      <div className="container">
        <Link to="/" className="navbar-brand py-0" aria-label="RoomEase home" onClick={close}>
          <Logo tone="dark" />
        </Link>
        <div className="d-flex align-items-center gap-1 d-lg-none">
          <ThemeToggle />
          <button className="icon-btn" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="public-nav" aria-label="Toggle navigation">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <div id="public-nav" className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto gap-lg-2 py-2 py-lg-0">
            {PUBLIC_NAV.map(({ to, label, end }) => (
              <li key={to} className="nav-item">
                <NavLink to={to} end={end} className="nav-link public-nav-link small fw-medium" onClick={close}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-2 pb-3 pb-lg-0">
            <span className="d-none d-lg-inline-flex">
              <ThemeToggle />
            </span>
            {user ? (
              <Link to={`/${user.role}`} className="btn btn-primary" onClick={close}>
                My dashboard
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-secondary" onClick={close}>
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn-primary" onClick={close}>
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

function PublicFooter() {
  return (
    <footer className="bg-sidebar-gradient text-white pt-5 pb-4">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-3">
            <Logo tagline="Find Your Perfect Room" />
            <p className="small text-white text-opacity-75 mt-3 mb-0" style={{ maxWidth: '20rem' }}>
              Helping students and workers in Baybay City find safe, affordable boarding houses, and helping landlords fill them.
            </p>
          </div>
          {FOOTER_COLUMNS.map(({ heading, links }) => (
            <div key={heading} className="col-6 col-md-4 col-lg-2">
              <h2 className="small fw-semibold text-uppercase text-white text-opacity-75 mb-3" style={{ letterSpacing: '0.06em' }}>
                {heading}
              </h2>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                {links.map(({ to, label, state }) => (
                  <li key={label}>
                    <Link to={to} state={state} className="link-light link-opacity-75 link-opacity-100-hover text-decoration-none">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-md-6 col-lg-3">
            <h2 className="small fw-semibold text-uppercase text-white text-opacity-75 mb-3" style={{ letterSpacing: '0.06em' }}>
              Contact
            </h2>
            <p className="d-flex align-items-center gap-2 small text-white text-opacity-75 mb-2">
              <Mail size={14} aria-hidden="true" />
              hello@roomease.ph
            </p>
            <p className="d-flex align-items-center gap-2 small text-white text-opacity-75 mb-0">
              <MapPin size={14} aria-hidden="true" />
              Baybay City, Leyte, Philippines
            </p>
          </div>
        </div>
        <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 border-top border-white border-opacity-10 pt-4 mt-5 text-xs text-white text-opacity-50">
          <span>© {YEAR} RoomEase. All rights reserved.</span>
          <span className="d-flex gap-3">
            <Link to="/privacy" className="link-light link-opacity-50 link-opacity-100-hover text-decoration-none">
              Privacy Policy
            </Link>
            <Link to="/terms" className="link-light link-opacity-50 link-opacity-100-hover text-decoration-none">
              Terms & Conditions
            </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}

// Pages anyone can open without signing in: home, Find Place to Stay, About, Contact, legal.
export default function PublicLayout() {
  const { pathname, hash } = useLocation()
  const compareBarVisible = useCompareBarVisible()

  // New page: start at the top, or at the #section the link points to.
  useEffect(() => {
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)))
    if (target) target.scrollIntoView()
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return (
    <SitePathsProvider value={PUBLIC_PATHS}>
      <div data-theme="boarder" className="landing d-flex flex-column min-vh-100">
        <a href="#main" className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-primary z-3">
          Skip to content
        </a>
        <PublicNav />
        <main id="main" className={`flex-grow-1 ${compareBarVisible ? 'pb-compare' : ''}`}>
          <Suspense fallback={<PublicPageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <PublicFooter />
        <CompareBar />
      </div>
    </SitePathsProvider>
  )
}

function PublicPageSkeleton() {
  return (
    <div className="container py-4 py-lg-5">
      <PageSkeleton />
    </div>
  )
}

// Room pages (browse, details, compare) inside the public frame.
export function PublicContainer() {
  const { pathname } = useLocation()
  return (
    <div className="container py-4 py-lg-5">
      <div key={pathname} className="page-enter">
        <Outlet />
      </div>
    </div>
  )
}
