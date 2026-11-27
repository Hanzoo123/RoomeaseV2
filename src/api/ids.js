import { DEMO_USERS, LISTINGS } from '../data/mockData'

// Temporary bridge: messages and notifications are still the browser's demo data until
// phase 5, keyed by the demo ids ("sunrise", "u-boarder-1"). So a MySQL row that is one of
// the demo listings or accounts keeps its demo id, and the others get "db-<id>".
const DEMO_LISTINGS = new Map(LISTINGS.map((listing) => [listing.name, listing]))
const DEMO_LANDLORDS = new Map(DEMO_USERS.filter((user) => user.role === 'landlord').map((user) => [user.name, user.id]))
const DEMO_EMAILS = new Map(DEMO_USERS.map((user) => [user.email.toLowerCase(), user.id]))

// { id, email } from the API
export const appUserId = (user) => DEMO_EMAILS.get(user.email?.toLowerCase()) ?? `db-${user.id}`

// { id, name } of a listing's landlord
export const appLandlordId = (landlord) => DEMO_LANDLORDS.get(landlord.name) ?? `db-${landlord.id}`

// The demo listing an API listing stands for: the same name, from the same demo landlord
// (a new listing that reuses a demo name is a different listing).
export function demoListingOf(listing) {
  const demo = DEMO_LISTINGS.get(listing.name)
  return demo && demo.ownerId === DEMO_LANDLORDS.get(listing.landlord?.name) ? demo : null
}

// { id, name, landlord: { name } }
export const appListingId = (listing) => demoListingOf(listing)?.id ?? `db-${listing.id}`
