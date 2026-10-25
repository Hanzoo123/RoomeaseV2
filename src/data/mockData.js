// Seed data for the frontend prototype. Replace with API calls once a backend exists.

// Demo-only credentials. Never ship real passwords in client code.
export const DEMO_USERS = [
  {
    id: 'u-boarder-1',
    role: 'boarder',
    name: 'Maria Santos',
    firstName: 'Maria',
    email: 'maria@roomease.ph',
    phone: '0917 123 4567',
    password: 'boarder123',
  },
  {
    id: 'u-landlord-1',
    role: 'landlord',
    name: 'Juan Dela Cruz',
    firstName: 'Juan',
    email: 'juan@roomease.ph',
    phone: '0918 765 4321',
    password: 'landlord123',
  },
]

// Contact details for landlords who own seed listings but have no demo login.
export const OTHER_LANDLORDS = {
  'u-landlord-2': { name: 'Rosa Villanueva', phone: '0919 222 3344' },
  'u-landlord-3': { name: 'Ramon Bautista', phone: '0927 555 0182' },
}

export const AREAS = ['Poblacion', 'San Isidro', 'Baybay City Center', 'Near VSU']
export const ROOM_TYPES = ['Single Room', 'Shared Room']
export const AMENITIES = ['Wi-Fi', 'Aircon', 'Private CR', 'Laundry', 'Study Area', 'Kitchen', 'CCTV', 'Parking']

// `art` picks the illustration used when `photo` is empty.
// `photo` can be a URL (e.g. '/images/sunrise.jpg' in /public) or an uploaded image.
export const LISTINGS = [
  {
    id: 'sunrise',
    ownerId: 'u-landlord-1',
    name: 'Sunrise Boarding House',
    area: 'Poblacion',
    city: 'Baybay City',
    address: '12 Rizal St., Poblacion Zone 3',
    price: 3000,
    roomType: 'Single Room',
    amenities: ['Wi-Fi', 'Aircon', 'CCTV'],
    description:
      'Quiet two-storey house a short walk from the public market and jeepney terminal. Each room has its own study table, cabinet and window. Water and electricity are included up to a monthly limit.',
    approval: 'Approved',
    totalRooms: 5,
    availableRooms: 2,
    availableSlots: 3,
    art: { house: 0, room: 'single' },
    photo: null,
  },
  {
    id: 'riverside',
    ownerId: 'u-landlord-1',
    name: 'Riverside Dormitory',
    area: 'San Isidro',
    city: 'Baybay City',
    address: 'Purok 2, San Isidro (beside the river park)',
    price: 2500,
    roomType: 'Shared Room',
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen'],
    description:
      'Dorm-style rooms with bunk beds for 2–4 boarders. Shared kitchen and laundry area on the ground floor. Curfew at 10 PM.',
    approval: 'Pending',
    totalRooms: 8,
    availableRooms: 3,
    availableSlots: 4,
    art: { house: 1, room: 'bunk' },
    photo: null,
  },
  {
    id: 'city-view',
    ownerId: 'u-landlord-1',
    name: 'City View Boarding House',
    area: 'Poblacion',
    city: 'Baybay City',
    address: '45 Magsaysay Ave., Poblacion',
    price: 3500,
    roomType: 'Single Room',
    amenities: ['Aircon', 'Private CR', 'Study Area'],
    description:
      'Air-conditioned single rooms with private bathrooms on the upper floors, overlooking the town center. Ideal for working professionals and graduating students.',
    approval: 'Approved',
    totalRooms: 4,
    availableRooms: 1,
    availableSlots: 1,
    art: { house: 2, room: 'desk' },
    photo: null,
  },
  {
    id: 'green-haven',
    ownerId: 'u-landlord-2',
    name: 'Green Haven Residences',
    area: 'Near VSU',
    city: 'Baybay City',
    address: 'Brgy. Pangasugan, 5 min walk to VSU main gate',
    price: 2800,
    roomType: 'Single Room',
    amenities: ['Wi-Fi', 'Aircon', 'Study Area', 'CCTV'],
    description:
      'Student-friendly single rooms surrounded by trees, a few minutes from the VSU main gate. Common study lounge with fast Wi-Fi.',
    approval: 'Approved',
    totalRooms: 10,
    availableRooms: 4,
    availableSlots: 4,
    art: { house: 1, room: 'desk' },
    photo: null,
  },
  {
    id: 'vsu-bedspace',
    ownerId: 'u-landlord-2',
    name: 'VSU Gate Bedspace',
    area: 'Near VSU',
    city: 'Baybay City',
    address: 'Highway, Brgy. Guadalupe, across VSU',
    price: 1500,
    roomType: 'Shared Room',
    amenities: ['Wi-Fi', 'Laundry'],
    description: 'Affordable bedspace for students. Four beds per room, shared bathrooms on each floor.',
    approval: 'Approved',
    totalRooms: 6,
    availableRooms: 2,
    availableSlots: 5,
    art: { house: 2, room: 'bunk' },
    photo: null,
  },
  {
    id: 'central-lodging',
    ownerId: 'u-landlord-3',
    name: 'Baybay Central Lodging',
    area: 'Baybay City Center',
    city: 'Baybay City',
    address: '8 Bonifacio St., City Center',
    price: 4000,
    roomType: 'Single Room',
    amenities: ['Wi-Fi', 'Aircon', 'Private CR', 'Parking'],
    description: 'Fully furnished rooms near banks, malls and the city hall. Includes weekly cleaning of common areas.',
    approval: 'Approved',
    totalRooms: 6,
    availableRooms: 1,
    availableSlots: 1,
    art: { house: 0, room: 'single' },
    photo: null,
  },
  {
    id: 'seaside',
    ownerId: 'u-landlord-3',
    name: 'Seaside Boarding House',
    area: 'San Isidro',
    city: 'Baybay City',
    address: 'Coastal Rd., San Isidro',
    price: 2000,
    roomType: 'Shared Room',
    amenities: ['Wi-Fi', 'Kitchen', 'Laundry'],
    description: 'Breezy shared rooms a block from the shoreline. Shared kitchen with refrigerator and rice cooker.',
    approval: 'Approved',
    totalRooms: 5,
    availableRooms: 0,
    availableSlots: 0,
    art: { house: 1, room: 'bunk' },
    photo: null,
  },
  {
    id: 'poblacion-inn',
    ownerId: 'u-landlord-3',
    name: 'Poblacion Student Inn',
    area: 'Poblacion',
    city: 'Baybay City',
    address: '3 Mabini St., Poblacion',
    price: 2200,
    roomType: 'Shared Room',
    amenities: ['Wi-Fi', 'Study Area', 'CCTV'],
    description: 'Two-person rooms with individual study desks. Near schools, eateries and printing shops.',
    approval: 'Approved',
    totalRooms: 7,
    availableRooms: 3,
    availableSlots: 5,
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

export const RESERVATIONS = [
  { id: 'r-105', date: '2026-04-26', boarderId: 'u-boarder-1', boarder: 'Maria Santos', listingId: 'sunrise', roomType: 'Single Room', moveIn: '2026-06-01', message: 'Hi! I’m an incoming 2nd year student at VSU. Is the room available from June?', status: 'Pending' },
  { id: 'r-104', date: '2026-04-25', boarderId: 'u-boarder-2', boarder: 'John Reyes', listingId: 'riverside', roomType: 'Shared Room', moveIn: '2026-05-15', message: '', status: 'Pending' },
  { id: 'r-103', date: '2026-04-24', boarderId: 'u-boarder-3', boarder: 'Ana Cruz', listingId: 'city-view', roomType: 'Single Room', moveIn: '2026-05-01', message: '', status: 'Approved' },
  { id: 'r-102', date: '2026-04-22', boarderId: 'u-boarder-4', boarder: 'Luis Garcia', listingId: 'sunrise', roomType: 'Single Room', moveIn: '2026-05-01', message: '', status: 'Approved' },
  { id: 'r-101', date: '2026-04-18', boarderId: 'u-boarder-5', boarder: 'Carla Mendoza', listingId: 'riverside', roomType: 'Shared Room', moveIn: '2026-05-01', message: '', status: 'Approved' },
]

export const NOTIFICATIONS = [
  { id: 'n-1', userId: 'u-boarder-1', date: '2026-04-26T09:14:00', title: 'Reservation request sent', body: 'Your request for Sunrise Boarding House is waiting for the landlord’s response.', link: '/boarder/reservations', read: false },
  { id: 'n-2', userId: 'u-boarder-1', date: '2026-04-25T16:40:00', title: 'New listing near VSU', body: 'Green Haven Residences has single rooms from ₱2,800/month.', link: '/boarder/rooms/green-haven', read: false },
  { id: 'n-3', userId: 'u-boarder-1', date: '2026-04-24T08:05:00', title: 'Saved listing almost full', body: 'City View Boarding House has only 1 room left.', link: '/boarder/rooms/city-view', read: false },
  { id: 'n-4', userId: 'u-landlord-1', date: '2026-04-26T09:14:00', title: 'New reservation request', body: 'Maria Santos wants a Single Room at Sunrise Boarding House.', link: '/landlord/reservations', read: false },
  { id: 'n-5', userId: 'u-landlord-1', date: '2026-04-25T11:30:00', title: 'New reservation request', body: 'John Reyes wants a Shared Room at Riverside Dormitory.', link: '/landlord/reservations', read: false },
  { id: 'n-6', userId: 'u-landlord-1', date: '2026-04-20T10:00:00', title: 'Listing approved', body: 'City View Boarding House is now visible to boarders.', link: '/landlord/listings/city-view', read: true },
]

export const INITIAL_FAVORITES = { 'u-boarder-1': ['sunrise', 'city-view'] }
export const INITIAL_RECENTLY_VIEWED = { 'u-boarder-1': ['green-haven'] }

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
const dateTime = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export function formatDate(isoDate) {
  return shortDate.format(new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate))
}

export function formatDateTime(isoDateTime) {
  return dateTime.format(new Date(isoDateTime))
}
