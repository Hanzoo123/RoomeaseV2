import { ROOM_TYPES, SHARED_ROOM_TYPES } from './mockData'

// A listing's rooms, each with its own type, rent and beds:
// { id, name, type, rent, capacity, slotsTaken, isOpen }.
// With the API they come from MySQL. The demo listings only have totals, so their rooms are
// made up from those (see roomsFromTotals), and saving a listing works the totals out again.

export const freeSlotsOf = (room) => (room.isOpen ? Math.max(0, room.capacity - room.slotsTaken) : 0)

// The listing-level numbers the cards, filters and dashboards use.
export function summarizeRooms(rooms) {
  const rents = rooms.map((room) => room.rent)
  const typeCounts = new Map()
  for (const room of rooms) typeCounts.set(room.type, (typeCounts.get(room.type) ?? 0) + 1)
  const roomTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).map(([type]) => type)
  return {
    price: rents.length ? Math.min(...rents) : 0,
    priceMax: rents.length ? Math.max(...rents) : 0,
    roomType: roomTypes[0] ?? 'Single Room',
    roomTypes,
    totalRooms: rooms.length,
    availableRooms: rooms.filter((room) => freeSlotsOf(room) > 0).length,
    availableSlots: rooms.reduce((sum, room) => sum + freeSlotsOf(room), 0),
  }
}

// Rooms for a demo listing saved before listings had rooms: "Room 1"…"Room N" of its room
// type and rent, with its open slots spread over its available rooms.
export function roomsFromTotals(listing) {
  const total = Math.max(1, listing.totalRooms ?? 1)
  const available = Math.min(total, listing.availableRooms ?? 0)
  const slots = Math.max(available, listing.availableSlots ?? 0)
  const shared = SHARED_ROOM_TYPES.includes(listing.roomType)
  const capacity = shared ? Math.max(2, Math.ceil(slots / Math.max(1, available))) : 1
  let slotsLeft = slots
  return Array.from({ length: total }, (_, index) => {
    const free = index < available ? Math.min(capacity, Math.max(1, slotsLeft - (available - index - 1))) : 0
    slotsLeft -= free
    return {
      id: `${listing.id}-r${index + 1}`,
      name: `Room ${index + 1}`,
      type: listing.roomType ?? 'Single Room',
      rent: listing.price ?? 0,
      capacity,
      slotsTaken: capacity - free,
      isOpen: true,
    }
  })
}

// ---------- The listing form's rooms (see pages/landlord/RoomsEditor) ----------

export const MAX_ROOMS = 50
// Beds a new room of each type starts with.
export const TYPE_BEDS = { 'Single Room': 1, 'Private Room': 1, 'Double Sharing': 2, 'Bed Spacer': 4, Dormitory: 6 }

let nextKey = 0
// A room as the form edits it: numbers are kept as typed (strings) until saving.
export function formRoom(room = {}) {
  nextKey += 1
  return {
    key: `room-${nextKey}`,
    id: room.id,
    name: room.name ?? '',
    type: room.type ?? ROOM_TYPES[0],
    rent: room.rent ? String(room.rent) : '',
    capacity: String(room.capacity ?? TYPE_BEDS[room.type ?? ROOM_TYPES[0]] ?? 1),
    slotsTaken: String(room.slotsTaken ?? 0),
    isOpen: room.isOpen ?? true,
    activeRequests: room.activeRequests ?? 0,
  }
}

export const roomValues = (room) => ({
  id: room.id,
  name: room.name.trim(),
  type: room.type,
  rent: Number(room.rent),
  capacity: Number(room.capacity),
  slotsTaken: Number(room.slotsTaken || 0),
  isOpen: room.isOpen,
})

// The same checks as the API, keyed like its answer: "rooms.2.rent".
export function roomErrors(rooms) {
  const errors = {}
  if (rooms.length === 0) errors.rooms = 'Add at least one room.'
  if (rooms.length > MAX_ROOMS) errors.rooms = `A listing can have up to ${MAX_ROOMS} rooms.`
  const names = new Set()
  rooms.forEach((room, index) => {
    const key = (field) => `rooms.${index}.${field}`
    const name = room.name.trim().toLowerCase()
    if (!name) errors[key('name')] = 'Name the room, e.g. Room 1.'
    else if (name.length > 60) errors[key('name')] = 'Keep it under 60 characters.'
    else if (names.has(name)) errors[key('name')] = 'Two rooms can’t have the same name.'
    names.add(name)
    const rent = Number(room.rent)
    if (!(rent >= 100 && rent <= 100000)) errors[key('rent')] = 'Enter ₱100 to ₱100,000.'
    const capacity = Number(room.capacity)
    if (!(capacity >= 1 && capacity <= 100)) errors[key('capacity')] = 'Enter 1 to 100.'
    else if (Number(room.slotsTaken || 0) > capacity) errors[key('slotsTaken')] = 'More than the beds.'
  })
  return errors
}
