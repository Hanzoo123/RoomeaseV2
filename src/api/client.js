import { API_URL } from '../config/api'

// The CSRF token from the last answer that carried one (GET /auth/me, sign-in, sign-up).
// It goes back in the X-CSRF-Token header of every request that changes something.
let csrfToken = ''

// Calls the PHP API. Never throws: resolves to { ok: true, data } or
// { ok: false, error, fields, code, status }, where error is a message to show.
export async function api(path, { method = 'GET', body } = {}, retried = false) {
  let response
  try {
    response = await fetch(API_URL + path, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(method !== 'GET' && { 'X-CSRF-Token': csrfToken }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    return { ok: false, status: 0, error: 'Can’t reach the RoomEase server. Is WAMP running?' }
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // Not JSON: usually a WAMP error page.
  }
  if (!payload) {
    return {
      ok: false,
      status: response.status,
      error: response.status === 404 ? 'The RoomEase API wasn’t found. Is the project inside C:\\wamp64\\www?' : 'The server sent an unexpected answer. Please try again.',
    }
  }
  if (payload.data?.csrfToken) csrfToken = payload.data.csrfToken

  // The token expired (e.g. the session ended): get a new one and try once more.
  if (!payload.ok && payload.code === 'csrf' && !retried) {
    const me = await api('/auth/me')
    if (me.ok) return api(path, { method, body }, true)
  }
  return payload.ok
    ? { ok: true, status: response.status, data: payload.data }
    : { ok: false, status: response.status, error: payload.error, fields: payload.fields, code: payload.code }
}
