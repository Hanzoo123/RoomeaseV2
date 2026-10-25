import { createContext, useCallback, useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

// Where room links point: the public "Find Place to Stay" pages (/rooms) or the
// boarder dashboard (/boarder/...). Shared components read this instead of hard-coding paths.
export const BOARDER_PATHS = { isPublic: false, browse: '/boarder/browse', compare: '/boarder/compare', room: (id) => `/boarder/rooms/${id}` }
export const PUBLIC_PATHS = { isPublic: true, browse: '/rooms', compare: '/rooms/compare', room: (id) => `/rooms/${id}` }

const SitePathsContext = createContext(BOARDER_PATHS)

export function SitePathsProvider({ value, children }) {
  return <SitePathsContext.Provider value={value}>{children}</SitePathsContext.Provider>
}

export function useSitePaths() {
  return useContext(SitePathsContext)
}

// Guests can browse freely; saving, reserving, reviewing and messaging need a boarder account.
// Returns a check: true when a boarder is signed in, otherwise explains and (for guests) opens sign-in.
export function useRequireBoarder() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    (action = 'do that') => {
      if (user?.role === 'boarder') return true
      if (user) {
        toast(`Sign in with a boarder account to ${action}.`, 'info')
        return false
      }
      toast(`Sign in or create a free account to ${action}.`, 'info')
      navigate('/login', { state: { from: location.pathname + location.search, role: 'boarder' } })
      return false
    },
    [user, toast, navigate, location.pathname, location.search],
  )
}

// Where to go after signing in. A boarder who signed in from a public room page carries on
// at the same place inside the dashboard (/rooms/x → /boarder/rooms/x).
export function pathAfterSignIn(from, role) {
  if (!from) return `/${role}`
  if (from.startsWith(`/${role}`)) return from
  if (role !== 'boarder' || !from.startsWith('/rooms')) return `/${role}`
  const [path, search] = from.split('?')
  const query = search ? `?${search}` : ''
  if (path === '/rooms') return `${BOARDER_PATHS.browse}${query}`
  if (path === '/rooms/compare') return BOARDER_PATHS.compare
  return `/boarder${path}${query}`
}
