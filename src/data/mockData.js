// Demo data for the frontend prototype. Replace with API calls once a backend exists.

// Demo-only credentials. Never ship real passwords in client code.
export const DEMO_USERS = [
  {
    id: 'u-boarder-1',
    role: 'boarder',
    name: 'Maria Santos',
    firstName: 'Maria',
    email: 'maria@roomease.ph',
    password: 'boarder123',
  },
  {
    id: 'u-landlord-1',
    role: 'landlord',
    name: 'Juan Dela Cruz',
    firstName: 'Juan',
    email: 'juan@roomease.ph',
    password: 'landlord123',
  },
]

// `art` picks the illustration used until real photos are added.
// Set `photo` to an image URL (e.g. '/images/sunrise.jpg' in /public) to use a real photo instead.
export const LISTINGS = [
  {
    id: 'sunrise',
    name: 'Sunrise Boarding House',
    area: 'Poblacion',
    city: 'Baybay City',
    price: 3000,
    roomType: 'Single Room',
    amenities: ['Wi-Fi', 'Aircon'],
    approval: 'Approved',
    totalRooms: 5,
    availableRooms: 2,
    availableSlots: 3,
    art: { house: 0, room: 'single' },
    photo: null,
  },
  {
    id: 'riverside',
    name: 'Riverside Dormitory',
    area: 'San Isidro',
    city: 'Baybay City',
    price: 2500,
    roomType: 'Shared Room',
    amenities: ['Wi-Fi'],
    approval: 'Pending',
    totalRooms: 8,
    availableRooms: 3,
    availableSlots: 4,
    art: { house: 1, room: 'bunk' },
    photo: null,
  },
  {
    id: 'city-view',
    name: 'City View Boarding House',
    area: 'Poblacion',
    city: 'Baybay City',
    price: 3500,
    roomType: 'Single Room',
    amenities: ['Aircon'],
    approval: 'Approved',
    totalRooms: 4,
    availableRooms: 1,
    availableSlots: 1,
    art: { house: 2, room: 'desk' },
    photo: null,
  },
]

export const LOCATIONS = [
  { id: 'poblacion', name: 'Poblacion', listings: 12, art: 0 },
  { id: 'san-isidro', name: 'San Isidro', listings: 8, art: 1 },
  { id: 'city-center', name: 'Baybay City Center', listings: 6, art: 2 },
  { id: 'near-vsu', name: 'Near VSU', listings: 5, art: 3 },
]

export const ROOM_TYPES = ['Single Room', 'Shared Room']

export const RESERVATIONS = [
  { id: 'r-105', date: '2026-04-26', boarder: 'Maria Santos', listingId: 'sunrise', roomType: 'Single Room', status: 'Pending' },
  { id: 'r-104', date: '2026-04-25', boarder: 'John Reyes', listingId: 'riverside', roomType: 'Shared Room', status: 'Pending' },
  { id: 'r-103', date: '2026-04-24', boarder: 'Ana Cruz', listingId: 'city-view', roomType: 'Single Room', status: 'Approved' },
  { id: 'r-102', date: '2026-04-22', boarder: 'Luis Garcia', listingId: 'sunrise', roomType: 'Single Room', status: 'Approved' },
  { id: 'r-101', date: '2026-04-18', boarder: 'Carla Mendoza', listingId: 'riverside', roomType: 'Shared Room', status: 'Approved' },
]

export const BOARDER_SUMMARY = {
  reservations: 1,
  notifications: 3,
  recentlyViewed: 1,
}

export const LANDLORD_SUMMARY = {
  notifications: 2,
}

export const INITIAL_FAVORITES = ['sunrise', 'city-view']

export function availabilityOf(listing) {
  if (listing.availableRooms === 0) return 'Full'
  if (listing.availableRooms === 1) return 'Limited Slots'
  return 'Available'
}

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })

export function formatPeso(amount) {
  return peso.format(amount)
}

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function formatDate(isoDate) {
  return shortDate.format(new Date(`${isoDate}T00:00:00`))
}
