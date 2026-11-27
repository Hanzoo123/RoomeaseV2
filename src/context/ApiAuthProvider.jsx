import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import { appUserId } from '../api/ids'
import { backendFileUrl } from '../config/api'
import { DEMO_USERS } from '../data/mockData'
import { AuthContext } from './authContext'
import { useToast } from './ToastContext'

// How often to ask the server whether this person is still signed in, so an account an
// admin deactivates is signed out here too (also checked whenever the tab comes back).
const RECHECK_MS = 60 * 1000

// The demo accounts keep their demo ids ("u-boarder-1") and new accounts get "db-<id>"
// (see api/ids.js); the API itself is always called with the MySQL id.
function toAppUser(user) {
  if (!user) return null
  return { ...user, dbId: user.id, id: appUserId(user), active: true, avatar: backendFileUrl(user.avatarPath) }
}

// Other people's names and numbers (e.g. a listing's landlord) still come from the demo data.
const DEMO_ACCOUNTS = DEMO_USERS.map(({ password: _password, ...account }) => ({ ...account, active: account.active !== false, firstName: account.name.split(' ')[0] }))

const result = (response, extra = {}) => (response.ok ? { ok: true, ...extra } : { ok: false, error: response.error, fields: response.fields })

export default function ApiAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const userRef = useRef(null)
  // Password reset tokens from step 2, kept until step 3 (never stored).
  const resetTokens = useRef({})
  const toast = useToast()

  const applyUser = useCallback((next) => {
    // Skip identical answers so the whole app doesn't re-render every minute.
    if (JSON.stringify(next) === JSON.stringify(userRef.current)) return
    userRef.current = next
    setUser(next)
  }, [])

  const recheck = useCallback(async () => {
    const response = await api('/auth/me')
    setReady(true)
    // Offline or a server error: keep things as they are and try again later.
    if (!response.ok) return
    const next = toAppUser(response.data.user)
    if (userRef.current && !next) {
      toast(
        response.data.signedOutReason === 'deactivated'
          ? 'Your account was deactivated. Contact the RoomEase team if you think this is a mistake.'
          : 'You’ve been signed out. Please sign in again.',
        'info',
      )
    }
    applyUser(next)
  }, [applyUser, toast])

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && recheck()
    const firstCheck = setTimeout(recheck, 0)
    const timer = setInterval(recheck, RECHECK_MS)
    window.addEventListener('focus', recheck)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(firstCheck)
      clearInterval(timer)
      window.removeEventListener('focus', recheck)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [recheck])

  const login = useCallback(
    async ({ email, password, role, remember }) => {
      const response = await api('/auth/login', { method: 'POST', body: { email: email.trim(), password, role, remember } })
      if (!response.ok) return result(response)
      const next = toAppUser(response.data.user)
      applyUser(next)
      return { ok: true, firstName: next.firstName }
    },
    [applyUser],
  )

  const register = useCallback(
    async ({ name, email, phone, password, role }) => {
      const response = await api('/auth/register', { method: 'POST', body: { name: name.trim(), email: email.trim(), phone: phone.trim(), password, role } })
      if (!response.ok) return result(response)
      const next = toAppUser(response.data.user)
      applyUser(next)
      return { ok: true, user: next }
    },
    [applyUser],
  )

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' })
    applyUser(null)
  }, [applyUser])

  // { name, email, phone } updates the details; { avatar } uploads a photo, { avatar: null } removes it.
  const updateProfile = useCallback(
    async (changes) => {
      const response =
        'avatar' in changes
          ? changes.avatar
            ? await api('/me/avatar', { method: 'POST', body: { image: changes.avatar } })
            : await api('/me/avatar', { method: 'DELETE' })
          : await api('/me', { method: 'PATCH', body: { name: changes.name, email: changes.email, phone: changes.phone } })
      if (response.ok) applyUser(toAppUser(response.data.user))
      return result(response)
    },
    [applyUser],
  )

  const changePassword = useCallback(async (current, next) => result(await api('/me/password', { method: 'POST', body: { current, next } })), [])

  // Until email is set up, the API returns the code so the page can show it (this computer only).
  const requestPasswordReset = useCallback(async (email) => {
    const response = await api('/auth/forgot', { method: 'POST', body: { email: email.trim() } })
    return result(response, response.ok ? { code: response.data.code, codeOnScreen: response.data.codeOnScreen } : {})
  }, [])

  const verifyResetCode = useCallback(async (email, code) => {
    const response = await api('/auth/verify-code', { method: 'POST', body: { email: email.trim(), code: code.trim() } })
    if (response.ok) resetTokens.current[email.trim().toLowerCase()] = response.data.token
    return result(response)
  }, [])

  const completePasswordReset = useCallback(async (email, password) => {
    const key = email.trim().toLowerCase()
    const response = await api('/auth/reset', { method: 'POST', body: { email: email.trim(), token: resetTokens.current[key] ?? '', password } })
    if (response.ok) delete resetTokens.current[key]
    return result(response)
  }, [])

  const accounts = useMemo(() => DEMO_ACCOUNTS.map((account) => (user && account.id === user.id ? { ...account, ...user } : account)), [user])
  const findAccount = useCallback((id) => accounts.find((account) => account.id === id) ?? null, [accounts])

  const value = useMemo(
    () => ({
      user,
      ready,
      accounts,
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
    [user, ready, accounts, login, register, updateProfile, changePassword, requestPasswordReset, verifyResetCode, completePasswordReset, logout, findAccount],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
