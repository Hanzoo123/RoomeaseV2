import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const FOOTER_LINKS = ['About Us', 'Contact', 'FAQ', 'Privacy Policy', 'Terms & Conditions']
const YEAR = new Date().getFullYear()

function Footer() {
  return (
    <footer className="flex flex-col gap-3 border-t border-line bg-white px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
        {FOOTER_LINKS.map((label) => (
          <a key={label} href="#" className="hover:text-ink">
            {label}
          </a>
        ))}
      </nav>
      <p>© {YEAR} RoomEase. All rights reserved.</p>
    </footer>
  )
}

export default function DashboardLayout({ role }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div data-theme={role} className="min-h-screen">
      <Sidebar role={role} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-68">
        <Topbar role={role} onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
