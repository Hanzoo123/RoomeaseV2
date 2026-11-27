import { api } from './client'
import { backendFileUrl } from '../config/api'
import { AREA_CENTERS, BAYBAY_CENTER, SHARED_ROOM_TYPES } from '../data/mockData'
import { appLandlordId, appListingId, demoListingOf } from './ids'

// An API listing in the shape the pages already use (see LISTINGS in data/mockData.js).
// Ids follow the bridge in ./ids.js, so "sunrise" stays "sunrise" and a new listing is "db-11".
export function toAppListing(listing) {
  const demo = demoListingOf(listing)
  const roomType = listing.roomTypes[0] ?? demo?.roomType ?? 'Single Room'
  return {
    ...listing.stayTerms,
    id: appListingId(listing),
    dbId: listing.id,
    ownerId: appLandlordId(listing.landlord),
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
    // { average, count } from MySQL (ratingOf reads it).
    rating: listing.rating,
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
