import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from 'lucide-react'
import { ROLE_META } from '../../config/navigation'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'

const SEARCH_TARGET = { boarder: '/boarder/browse', landlord: '/landlord/listings' }

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function UserMenu({ role }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => !menuRef.current?.contains(event.target) && setOpen(false)
    const onKeyDown = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const displayName = role === 'boarder' ? `Hi, ${user.firstName}` : user.name

  function handleLogout() {
    logout()
    navigate('/login', { replace: true, state: { role } })
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 hover:bg-page sm:pr-2"
      >
        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-accent to-sidebar text-xs font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">{displayName}</span>
          <span className="block text-xs text-muted">{ROLE_META[role].label}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted sm:block" aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
          <div className="border-b border-line px-4 py-2.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <Link role="menuitem" to={`/${role}/profile`} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-page">
            <User className="size-4 text-muted" /> My Profile
          </Link>
          <Link role="menuitem" to={`/${role}/settings`} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-page">
            <Settings className="size-4 text-muted" /> Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Topbar({ role, onMenu }) {
  const navigate = useNavigate()
  const { counts } = useData()
  const [query, setQuery] = useState('')
  const notifications = counts.notifications

  function handleSearch(event) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `${SEARCH_TARGET[role]}?q=${encodeURIComponent(q)}` : SEARCH_TARGET[role])
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} aria-label="Open menu" className="-ml-1 rounded-md p-1.5 text-ink hover:bg-page lg:hidden">
          <Menu className="size-5" />
        </button>

        <form role="search" onSubmit={handleSearch} className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ROLE_META[role].searchPlaceholder}
            aria-label={ROLE_META[role].searchPlaceholder.replace('...', '')}
            className="h-10 w-full rounded-full border border-line bg-white pr-4 pl-10 text-sm placeholder:text-muted/80 focus:border-accent focus:ring-2 focus:ring-accent/15 focus:outline-none"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <Link
            to={`/${role}/notifications`}
            aria-label={`Notifications, ${notifications} unread`}
            className="relative rounded-full p-2 text-ink hover:bg-page"
          >
            <Bell className="size-5" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] leading-4 font-semibold text-white">
                {notifications}
              </span>
            )}
          </Link>
          <UserMenu role={role} />
        </div>
      </div>
    </header>
  )
}
