import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_USERS } from '../data/mockData'
import { loadJSON, newId, saveJSON } from '../data/storage'
import { validateEmail } from '../data/validation'

// Mock auth for the prototype: accounts live in localStorage. Replace with a real API later.
const USERS_KEY = 'roomease.users'
const SESSION_KEY = 'roomease.session'
const RESET_CODE_MINUTES = 10
const RESET_MAX_ATTEMPTS = 5
const AuthContext = createContext(null)

export const ROLE_LABEL = { boarder: 'Boarder', landlord: 'Landlord' }

export { validateEmail }

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
  return { ...user, active: account.active !== false, firstName: account.name.trim().split(/\s+/)[0] }
}

// Saved accounts win (they hold changed passwords and profiles); seed accounts added
// in a newer version of the app are filled in. Admin accounts saved by an older version
// are dropped: admins now sign in to the AdminLTE panel.
function loadAccounts() {
  const saved = loadJSON(USERS_KEY, []).filter((account) => account.role !== 'admin')
  const savedIds = new Set(saved.map((account) => account.id))
  const seedById = Object.fromEntries(DEMO_USERS.map((account) => [account.id, account]))
  return [...saved.map((account) => ({ ...seedById[account.id], ...account })), ...DEMO_USERS.filter((account) => !savedIds.has(account.id))]
}

const sameEmail = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(loadAccounts)
  const [session, setSession] = useState(readSession)
  // Password reset codes, kept in memory only (a real backend would email them).
  const resets = useRef({})

  useEffect(() => {
    saveJSON(USERS_KEY, accounts)
  }, [accounts])

  // A deactivated account is signed out on its next render.
  const user = useMemo(() => {
    const account = accounts.find((item) => item.id === session?.userId)
    return account && account.active !== false ? toSessionUser(account) : null
  }, [accounts, session])

  const emailTaken = useCallback((email, exceptId) => accounts.some((account) => account.id !== exceptId && sameEmail(account.email, email)), [accounts])

  const login = useCallback(
    ({ email, password, role, remember }) => {
      const match = accounts.find((account) => sameEmail(account.email, email) && account.password === password)
      if (!match) return { ok: false, error: 'Incorrect email or password.' }
      if (match.active === false) return { ok: false, error: 'This account has been deactivated. Contact the RoomEase team if you think this is a mistake.' }
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
      if (!['boarder', 'landlord'].includes(role)) return { ok: false, error: 'Choose Boarder or Landlord.' }
      if (emailTaken(email)) return { ok: false, error: 'An account with this email already exists. Sign in instead.' }
      const account = { id: newId(`u-${role}`), role, name: name.trim(), email: email.trim(), phone: phone.trim(), password, createdAt: new Date().toISOString() }
      setAccounts((current) => [...current, account])
      writeSession(account.id, true)
      setSession({ userId: account.id })
      return { ok: true, user: toSessionUser(account) }
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

  // Step 1 of "Forgot password". Returns the code so the demo can show it on screen.
  const requestPasswordReset = useCallback(
    (email) => {
      const account = accounts.find((item) => sameEmail(item.email, email))
      if (!account || account.active === false) return { ok: true, code: null }
      const code = String(Math.floor(100000 + Math.random() * 900000))
      resets.current[account.email.toLowerCase()] = { code, expires: Date.now() + RESET_CODE_MINUTES * 60000, attempts: 0 }
      return { ok: true, code }
    },
    [accounts],
  )

  // Step 2: check the 6-digit code. Five wrong tries cancel it.
  const verifyResetCode = useCallback((email, code) => {
    const entry = resets.current[email.trim().toLowerCase()]
    if (!entry || Date.now() > entry.expires) return { ok: false, error: 'This code has expired. Request a new one.' }
    if (entry.attempts >= RESET_MAX_ATTEMPTS) return { ok: false, error: 'Too many wrong tries. Request a new code.' }
    if (entry.code !== code.trim()) {
      entry.attempts += 1
      const left = RESET_MAX_ATTEMPTS - entry.attempts
      return { ok: false, error: left ? `That code isn’t right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong tries. Request a new code.' }
    }
    entry.verified = true
    return { ok: true }
  }, [])

  // Step 3: set the new password (only after the code was verified).
  const completePasswordReset = useCallback((email, password) => {
    const key = email.trim().toLowerCase()
    const entry = resets.current[key]
    if (!entry?.verified || Date.now() > entry.expires) return { ok: false, error: 'Your reset session expired. Start again.' }
    delete resets.current[key]
    setAccounts((current) => current.map((item) => (sameEmail(item.email, email) ? { ...item, password } : item)))
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const findAccount = useCallback((id) => toSessionUser(accounts.find((account) => account.id === id)), [accounts])
  const publicAccounts = useMemo(() => accounts.map(toSessionUser), [accounts])

  const value = useMemo(
    () => ({
      user,
      accounts: publicAccounts,
      login,
      register,
      updateProfile,
      changePassword,
      requestPasswordReset,
      verifyResetCode,
      completePasswordReset,
      logout,
      findAccount,
    }),
    [user, publicAccounts, login, register, updateProfile, changePassword, requestPasswordReset, verifyResetCode, completePasswordReset, logout, findAccount],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
