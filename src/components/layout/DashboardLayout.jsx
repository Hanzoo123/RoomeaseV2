import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { PageSkeleton } from '../ui/feedback'
import { CompareBar, useCompareBarVisible } from '../listings/CompareControls'

const FOOTER_LINKS = ['About Us', 'Contact', 'FAQ', 'Privacy Policy', 'Terms & Conditions']
const YEAR = new Date().getFullYear()

function Footer() {
  return (
    <footer className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 border-top bg-body px-3 px-sm-4 px-lg-5 py-3 text-xs text-body-secondary">
      <nav aria-label="Footer" className="d-flex flex-wrap column-gap-4 row-gap-1">
        {FOOTER_LINKS.map((label) => (
          <a key={label} href="#" className="link-secondary text-decoration-none">
            {label}
          </a>
        ))}
      </nav>
      <p className="mb-0">© {YEAR} RoomEase. All rights reserved.</p>
    </footer>
  )
}

export default function DashboardLayout({ role }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const compareBarVisible = useCompareBarVisible() && role === 'boarder'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div data-theme={role}>
      <Sidebar role={role} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="app-shell">
        <Topbar role={role} onMenu={() => setMenuOpen(true)} />
        <main className={`flex-grow-1 px-3 px-sm-4 px-lg-5 py-4 ${compareBarVisible ? 'pb-compare' : ''}`}>
          <div key={pathname} className="content-width page-enter">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        <Footer />
      </div>
      {role === 'boarder' && <CompareBar />}
    </div>
  )
}
