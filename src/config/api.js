import { BASE_PATH } from './base'

// The website uses the PHP API (backend/api) and the MySQL database, unless VITE_USE_API is
// "false": then accounts stay in this browser, as in the first prototype (no WAMP needed).
export const USE_API = import.meta.env.VITE_USE_API !== 'false'

// With `npm run dev`, Vite forwards /backend/… to WAMP (see vite.config.js).
export const API_URL = `${BASE_PATH}backend/api`

// A file the API saved (e.g. a profile photo), from its path relative to backend/.
export const backendFileUrl = (path) => (path ? `${BASE_PATH}backend/${path}` : null)

// Passwords of the demo accounts in database/roomease.sql.
export const API_DEMO_PASSWORDS = { boarder: 'Boarder#2026', landlord: 'Landlord#2026' }
