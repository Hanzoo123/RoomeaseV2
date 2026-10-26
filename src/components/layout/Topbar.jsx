import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun, User } from 'lucide-react'
import { ROLE_META } from '../../config/navigation'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'
import Avatar from '../ui/Avatar'
import { ThemeToggle } from '../ui/feedback'

const SEARCH_TARGET = { boarder: '/boarder/browse', landlord: '/landlord/listings' }

function UserMenu({ role }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const toast = useToast()
  const { theme, toggleTheme } = useTheme()

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
    toast('You’ve been signed out.', 'info')
    navigate('/login', { replace: true, state: { role } })
  }

  return (
    <div ref={menuRef} className="dropdown">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="btn btn-link text-decoration-none text-body d-flex align-items-center gap-2 p-1 rounded-pill"
      >
        <Avatar person={user} />
        <span className="d-none d-sm-block text-start lh-sm">
          <span className="d-block small fw-semibold">{displayName}</span>
          <span className="d-block text-xs text-body-secondary fw-normal">{ROLE_META[role].label}</span>
        </span>
        <ChevronDown size={16} className="d-none d-sm-block text-body-secondary" aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="dropdown-menu dropdown-menu-end show shadow" data-bs-popper="static" style={{ minWidth: '13rem' }}>
          <div className="px-3 py-2 border-bottom mb-1">
            <p className="small fw-semibold text-truncate mb-0">{user.name}</p>
            <p className="text-xs text-body-secondary text-truncate mb-0">{user.email}</p>
          </div>
          <Link role="menuitem" to={`/${role}/profile`} onClick={() => setOpen(false)} className="dropdown-item d-flex align-items-center gap-2">
            <User size={16} className="text-body-secondary" /> My Profile
          </Link>
          <Link role="menuitem" to={`/${role}/settings`} onClick={() => setOpen(false)} className="dropdown-item d-flex align-items-center gap-2">
            <Settings size={16} className="text-body-secondary" /> Settings
          </Link>
          <button role="menuitem" type="button" onClick={toggleTheme} className="dropdown-item d-flex align-items-center gap-2">
            {theme === 'dark' ? <Sun size={16} className="text-body-secondary" /> : <Moon size={16} className="text-body-secondary" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="dropdown-divider" />
          <button role="menuitem" type="button" onClick={handleLogout} className="dropdown-item d-flex align-items-center gap-2 text-danger">
            <LogOut size={16} /> Log out
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
    <header className="topbar sticky-top border-bottom">
      <div className="d-flex align-items-center gap-2 gap-sm-3 px-3 px-sm-4 px-lg-5" style={{ height: '4rem' }}>
        <button type="button" onClick={onMenu} aria-label="Open menu" className="icon-btn d-lg-none">
          <Menu size={20} />
        </button>

        <form role="search" onSubmit={handleSearch} className="input-icon w-100 topbar-search">
          <Search size={16} className="lead-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ROLE_META[role].searchPlaceholder}
            aria-label={ROLE_META[role].searchPlaceholder.replace('...', '')}
            className="form-control rounded-pill"
            style={{ height: '2.5rem' }}
          />
        </form>

        <div className="ms-auto d-flex align-items-center gap-1 gap-sm-2">
          <ThemeToggle className="icon-btn d-none d-sm-inline-grid" />
          <Link to={`/${role}/notifications`} aria-label={`Notifications, ${notifications} unread`} className="icon-btn">
            <Bell size={20} />
            {notifications > 0 && <span className="count-badge count-badge-sm">{notifications}</span>}
          </Link>
          <UserMenu role={role} />
        </div>
      </div>
    </header>
  )
}
