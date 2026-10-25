import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { NAVIGATION, ROLE_META } from '../../config/navigation'
import { useData } from '../../context/DataContext'
import { SidebarArt } from '../illustrations/BrandArt'
import Logo, { LogoMark } from '../ui/Logo'

function SidebarContent({ role, onNavigate, onClose }) {
  const { counts } = useData()
  const meta = ROLE_META[role]

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-sidebar to-sidebar-deep text-white">
      <div className="flex items-center justify-between px-5 py-6">
        <Logo tagline={meta.tagline} />
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-md p-1 text-white/80 hover:bg-white/10">
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAVIGATION[role].map(({ label, to, icon: Icon, end, badge }) => {
          const count = badge ? counts[badge] : 0
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-active font-semibold text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.45)]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="size-[18px] shrink-0" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] leading-5 font-semibold">
                  {count}
                  <span className="sr-only"> new</span>
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-6 pt-6 pb-5 text-center">
        <SidebarArt className="mx-auto w-40" />
        <p className="mt-3 text-sm leading-snug text-white/90">
          {meta.sidebarCaption[0]}
          <br />
          {meta.sidebarCaption[1]}
        </p>
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-5 py-4 text-sm font-semibold">
        <LogoMark className="size-5" />
        RoomEase
      </div>
    </div>
  )
}

export default function Sidebar({ role, open, onClose }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 lg:block">
        <SidebarContent role={role} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            <SidebarContent role={role} onNavigate={onClose} onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
