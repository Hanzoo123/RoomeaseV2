import { api } from './client'
import { appListingId, appUserId } from './ids'

// Reservation requests and saved listings (GET/POST /reservations, /landlord/reservations,
// /favorites). Statuses use the app's words: MySQL's "accepted" is "Approved".
const STATUS = { pending: 'Pending', accepted: 'Approved', declined: 'Declined', cancelled: 'Cancelled' }

// An API request in the shape the pages already use (see RESERVATIONS in data/mockData.js).
export function toAppReservation(reservation) {
  return {
    id: reservation.id,
    // The local date it was sent (the API answers in Philippine time).
    date: reservation.createdAt.slice(0, 10),
    status: STATUS[reservation.status] ?? 'Pending',
    moveIn: reservation.moveIn,
    message: reservation.message ?? '',
    landlordNote: reservation.landlordNote,
    decidedAt: reservation.decidedAt,
    listingId: appListingId(reservation.listing),
    listingDbId: reservation.listing.id,
    listingName: reservation.listing.name,
    landlordName: reservation.listing.landlord.name,
    landlordPhone: reservation.listing.landlord.phone,
    roomId: reservation.room.id,
    roomName: reservation.room.name,
    roomType: reservation.room.type,
    rent: reservation.room.rent,
    boarderId: appUserId(reservation.boarder),
    boarderDbId: reservation.boarder.id,
    boarder: reservation.boarder.name,
    boarderEmail: reservation.boarder.email,
    boarderPhone: reservation.boarder.phone,
  }
}

const list = (response) => (response.ok ? { ok: true, data: response.data.reservations.map(toAppReservation) } : response)
const one = (response) => (response.ok ? { ok: true, reservation: toAppReservation(response.data.reservation) } : response)

// The boarder's own requests.
export const fetchMyReservations = async () => list(await api('/reservations'))
// { roomId, moveIn: "2026-12-01", message }
export const requestRoom = async (fields) => one(await api('/reservations', { method: 'POST', body: fields }))
export const cancelReservation = async (reservation) => one(await api(`/reservations/${reservation.id}/cancel`, { method: 'POST' }))

// Requests for the landlord's rooms.
export const fetchIncomingReservations = async () => list(await api('/landlord/reservations'))
// decision: "accept" or "decline"
export const decideReservation = async (reservation, decision, note) =>
  one(await api(`/landlord/reservations/${reservation.id}/decide`, { method: 'POST', body: { decision, note } }))

// The MySQL ids of the boarder's saved listings, newest first.
const favorites = (response) => (response.ok ? { ok: true, data: response.data.ids } : response)
export const fetchFavorites = async () => favorites(await api('/favorites'))
export const saveFavorite = async (listingDbId, saved) => favorites(await api(`/favorites/${listingDbId}`, { method: saved ? 'PUT' : 'DELETE' }))
