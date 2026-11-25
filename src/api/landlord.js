import { api } from './client'
import { toAppListing } from './listings'

// The signed-in landlord's own listings (GET/POST/PUT/DELETE /landlord/listings).

const APPROVAL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }

// A landlord's listing in the app's shape: the public fields plus review status, the
// admin's reason, every room, and the id of each photo (so an edit can keep them).
export function toOwnListing(listing) {
  return {
    ...toAppListing(listing),
    approval: APPROVAL[listing.status] ?? 'Pending',
    rejectionReason: listing.rejectionReason,
    removed: listing.removed,
    removedReason: listing.removalReason,
    submittedAt: listing.submittedAt,
    moderatedAt: listing.moderatedAt,
    rooms: listing.rooms,
    photoIds: listing.photoIds,
  }
}

export async function fetchMyListings() {
  const response = await api('/landlord/listings')
  return response.ok ? { ok: true, listings: response.data.listings.map(toOwnListing) } : response
}

// fields: what the listing form collects (see ListingForm). Photos already saved are sent
// by id, new ones as data URLs; the first is the cover.
function toPayload(fields, existing) {
  const savedIds = new Map((existing?.photos ?? []).map((url, index) => [url, existing.photoIds?.[index]]))
  return {
    name: fields.name,
    area: fields.area,
    address: fields.address,
    description: fields.description,
    coords: fields.coords,
    amenities: fields.amenities,
    utilities: fields.utilities,
    houseRules: fields.houseRules,
    curfew: fields.curfew,
    minimumStayMonths: fields.minimumStayMonths,
    paymentMethods: fields.paymentMethods,
    genderPolicy: fields.genderPolicy,
    visitorsAllowed: fields.visitorsAllowed,
    cookingAllowed: fields.cookingAllowed,
    petsAllowed: fields.petsAllowed,
    rooms: fields.rooms.map((room) => ({
      ...(typeof room.id === 'number' && { id: room.id }),
      name: room.name,
      type: room.type,
      rent: room.rent,
      capacity: room.capacity,
      slotsTaken: room.slotsTaken,
      isOpen: room.isOpen,
    })),
    photos: fields.photos.map((url) => (savedIds.get(url) ? { id: savedIds.get(url) } : { data: url })),
  }
}

// Resolves to { ok, listing, resubmitted } or { ok: false, error, fields }.
export async function saveMyListing(fields, existing) {
  const response = existing
    ? await api(`/landlord/listings/${existing.dbId}`, { method: 'PUT', body: toPayload(fields, existing) })
    : await api('/landlord/listings', { method: 'POST', body: toPayload(fields, null) })
  return response.ok ? { ok: true, listing: toOwnListing(response.data.listing), resubmitted: Boolean(response.data.resubmitted) } : response
}

export function deleteMyListing(listing) {
  return api(`/landlord/listings/${listing.dbId}`, { method: 'DELETE' })
}

// changes: { slotsTaken?, isOpen? }. Resolves to the updated listing.
export async function updateMyRoom(roomId, changes) {
  const response = await api(`/landlord/rooms/${roomId}`, { method: 'PATCH', body: changes })
  return response.ok ? { ok: true, listing: toOwnListing(response.data.listing) } : response
}
