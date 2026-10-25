import { NavLink } from 'react-router-dom'
import { NAVIGATION, ROLE_META } from '../../config/navigation'
import { useData } from '../../context/DataContext'
import { SidebarArt } from '../illustrations/BrandArt'
import Logo, { LogoMark } from '../ui/Logo'

function SidebarContent({ role, onNavigate, onClose }) {
  const { counts } = useData()
  const meta = ROLE_META[role]

  return (
    <div className="sidebar-panel">
      <div className="d-flex align-items-center justify-content-between px-4 py-4">
        <Logo tagline={meta.tagline} />
        {onClose && <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close menu" />}
      </div>

      <nav aria-label="Main" className="flex-grow-1 overflow-y-auto px-3 d-flex flex-column gap-1">
        {NAVIGATION[role].map(({ label, to, icon: Icon, end, badge }) => {
          const count = badge ? counts[badge] : 0
          return (
            <NavLink key={to} to={to} end={end} onClick={onNavigate} className="sidebar-link">
              <Icon size={18} className="flex-shrink-0" aria-hidden="true" />
              <span className="flex-grow-1">{label}</span>
              {count > 0 && (
                <span className="count-badge">
                  {count}
                  <span className="visually-hidden"> new</span>
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-4 pt-4 pb-3 text-center">
        <SidebarArt className="sidebar-art mx-auto d-block" />
        <p className="small text-white text-opacity-75 lh-sm mt-3 mb-0">
          {meta.sidebarCaption[0]}
          <br />
          {meta.sidebarCaption[1]}
        </p>
      </div>

      <div className="d-flex align-items-center gap-2 border-top border-white border-opacity-10 px-4 py-3 small fw-semibold">
        <LogoMark />
        RoomEase
      </div>
    </div>
  )
}

export default function Sidebar({ role, open, onClose }) {
  return (
    <>
      <aside className="app-sidebar d-none d-lg-block">
        <SidebarContent role={role} />
      </aside>

      {open && (
        <div className="d-lg-none">
          <div className="offcanvas-backdrop fade show" onClick={onClose} aria-hidden="true" />
          <aside className="offcanvas offcanvas-start show app-drawer" aria-label="Menu">
            <SidebarContent role={role} onNavigate={onClose} onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
