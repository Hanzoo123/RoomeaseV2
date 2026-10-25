import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DEMO_USERS } from '../data/mockData'

const STORAGE_KEY = 'roomease.session'
const AuthContext = createContext(null)

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSession(user, remember) {
  try {
    const store = remember ? localStorage : sessionStorage
    store.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch {
    // Storage can be unavailable (private mode); the session then lasts until reload.
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}

const ROLE_LABEL = { boarder: 'Boarder', landlord: 'Landlord' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  // Mock sign-in against the demo accounts. Swap for a real API call later.
  const login = useCallback(({ email, password, role, remember }) => {
    const match = DEMO_USERS.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.password === password,
    )
    if (!match) return { ok: false, error: 'Incorrect email or password.' }
    if (match.role !== role) {
      return {
        ok: false,
        error: `This account is registered as a ${ROLE_LABEL[match.role]}. Switch to the ${ROLE_LABEL[match.role]} tab to sign in.`,
      }
    }

    const { password: _password, ...sessionUser } = match
    writeSession(sessionUser, remember)
    setUser(sessionUser)
    return { ok: true, user: sessionUser }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
