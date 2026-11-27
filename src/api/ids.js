import { DEMO_USERS, LISTINGS } from '../data/mockData'

// App ids for MySQL rows. A demo listing or account keeps its demo id ("sunrise",
// "u-boarder-1"), so its page address and illustration stay the same and what this browser
// keeps per person (the compare list, recently viewed rooms) still matches; the others get
// "db-<id>". Requests to the API always use the MySQL id (dbId).
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
