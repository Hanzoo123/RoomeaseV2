import { api } from './client'
import { backendFileUrl } from '../config/api'
import { AREA_CENTERS, BAYBAY_CENTER, DEMO_USERS, LISTINGS, SHARED_ROOM_TYPES } from '../data/mockData'

// Public listings come from MySQL, but favorites, reservations, reviews and messages are still
// the demo data in this browser, keyed by the demo listing ids ("sunrise"). Until those move to
// the API (phases 3–5), a listing that is one of the demo listings keeps its demo id and
// illustration, and its landlord keeps the demo landlord id; others get "db-<id>".
const DEMO_LISTINGS = new Map(LISTINGS.map((listing) => [listing.name, listing]))
const DEMO_LANDLORDS = new Map(DEMO_USERS.filter((user) => user.role === 'landlord').map((user) => [user.name, user.id]))

// An API listing in the shape the pages already use (see LISTINGS in data/mockData.js).
export function toAppListing(listing) {
  const demo = DEMO_LISTINGS.get(listing.name)
  const roomType = listing.roomTypes[0] ?? demo?.roomType ?? 'Single Room'
  return {
    ...listing.stayTerms,
    id: demo?.id ?? `db-${listing.id}`,
    dbId: listing.id,
    ownerId: DEMO_LANDLORDS.get(listing.landlord.name) ?? `db-${listing.landlord.id}`,
    landlord: listing.landlord,
    name: listing.name,
    area: listing.area,
    city: listing.city,
    address: listing.address,
    description: listing.description,
    // Rent is per room in MySQL: the cheapest room, and the dearest for "₱2,000–₱2,500".
    price: listing.rent?.min ?? 0,
    priceMax: listing.rent?.max ?? 0,
    // The most common room type first; filters match any of them.
    roomType,
    roomTypes: listing.roomTypes,
    amenities: listing.amenities,
    utilities: listing.utilities,
    houseRules: listing.houseRules,
    approval: 'Approved',
    removed: false,
    rejectionReason: null,
    totalRooms: listing.roomCounts.total,
    availableRooms: listing.roomCounts.open,
    availableSlots: listing.roomCounts.freeSlots,
    art: demo?.art ?? { house: listing.id % 3, room: SHARED_ROOM_TYPES.includes(roomType) ? 'bunk' : 'single' },
    photos: listing.photos.map(backendFileUrl),
    coords: listing.coords ?? AREA_CENTERS[listing.area] ?? BAYBAY_CENTER,
    views: listing.views,
    submittedAt: listing.listedAt,
  }
}

// Every approved listing (a city has few enough to load at once; the browse filters run here).
export async function fetchPublicListings() {
  const response = await api('/listings?perPage=200')
  return response.ok ? { ok: true, listings: response.data.listings.map(toAppListing) } : response
}

// One listing's rooms, each with its own type, rent and free slots.
export async function fetchListingRooms(dbId) {
  const response = await api(`/listings/${dbId}`)
  return response.ok ? { ok: true, rooms: response.data.listing.rooms.map((room) => ({ ...room, photos: room.photos.map(backendFileUrl) })) } : response
}

// Counts a visit to the room page (the server counts each listing once per session).
export function countListingView(dbId) {
  return api(`/listings/${dbId}/view`, { method: 'POST' })
}
