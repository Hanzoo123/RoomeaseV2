import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_USERS } from '../data/mockData'
import { loadJSON, newId, saveJSON } from '../data/storage'

// Mock auth for the prototype: accounts live in localStorage. Replace with a real API later.
const USERS_KEY = 'roomease.users'
const SESSION_KEY = 'roomease.session'
const AuthContext = createContext(null)

const ROLE_LABEL = { boarder: 'Boarder', landlord: 'Landlord' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readSession() {
  try {
    // A tab-only session ("Remember me" off) wins, so two tabs can be signed in as different users.
    const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSession(userId, remember) {
  try {
    const store = remember ? localStorage : sessionStorage
    store.setItem(SESSION_KEY, JSON.stringify({ userId }))
  } catch {
    // Storage can be unavailable (private mode); the session then lasts until reload.
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Nothing to clear.
  }
}

function toSessionUser(account) {
  if (!account) return null
  const { password: _password, ...user } = account
  return { ...user, firstName: account.name.trim().split(/\s+/)[0] }
}

export function validateEmail(email) {
  return EMAIL_PATTERN.test(email.trim())
}

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(() => loadJSON(USERS_KEY, DEMO_USERS))
  const [session, setSession] = useState(readSession)

  useEffect(() => {
    saveJSON(USERS_KEY, accounts)
  }, [accounts])

  const user = useMemo(
    () => toSessionUser(accounts.find((account) => account.id === session?.userId)),
    [accounts, session],
  )

  const emailTaken = useCallback(
    (email, exceptId) => accounts.some((account) => account.id !== exceptId && account.email.toLowerCase() === email.trim().toLowerCase()),
    [accounts],
  )

  const login = useCallback(
    ({ email, password, role, remember }) => {
      const match = accounts.find(
        (account) => account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password,
      )
      if (!match) return { ok: false, error: 'Incorrect email or password.' }
      if (match.role !== role) {
        return {
          ok: false,
          error: `This account is registered as a ${ROLE_LABEL[match.role]}. Switch to the ${ROLE_LABEL[match.role]} tab to sign in.`,
        }
      }
      writeSession(match.id, remember)
      setSession({ userId: match.id })
      return { ok: true, firstName: toSessionUser(match).firstName }
    },
    [accounts],
  )

  const register = useCallback(
    ({ name, email, phone, password, role }) => {
      if (emailTaken(email)) return { ok: false, error: 'An account with this email already exists. Sign in instead.' }
      const account = { id: newId(`u-${role}`), role, name: name.trim(), email: email.trim(), phone: phone.trim(), password }
      setAccounts((current) => [...current, account])
      writeSession(account.id, true)
      setSession({ userId: account.id })
      return { ok: true }
    },
    [emailTaken],
  )

  const updateProfile = useCallback(
    (changes) => {
      if (!user) return { ok: false, error: 'You are signed out.' }
      if (changes.email && emailTaken(changes.email, user.id)) return { ok: false, error: 'Another account already uses this email.' }
      setAccounts((current) => current.map((account) => (account.id === user.id ? { ...account, ...changes } : account)))
      return { ok: true }
    },
    [user, emailTaken],
  )

  const changePassword = useCallback(
    (currentPassword, nextPassword) => {
      const account = accounts.find((item) => item.id === user?.id)
      if (!account || account.password !== currentPassword) return { ok: false, error: 'Your current password is incorrect.' }
      setAccounts((current) => current.map((item) => (item.id === account.id ? { ...item, password: nextPassword } : item)))
      return { ok: true }
    },
    [accounts, user],
  )

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const findAccount = useCallback((id) => toSessionUser(accounts.find((account) => account.id === id)), [accounts])

  const value = useMemo(
    () => ({ user, login, register, updateProfile, changePassword, logout, findAccount }),
    [user, login, register, updateProfile, changePassword, logout, findAccount],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
