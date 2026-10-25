// Seed data for the frontend prototype. Replace with API calls once a backend exists.
// Dates are relative to today so the demo always looks current.

const DAY = 24 * 60 * 60 * 1000
const localDate = (date) => date.toLocaleDateString('en-CA')
const daysAgo = (days) => localDate(new Date(Date.now() - days * DAY))
const daysAhead = (days) => localDate(new Date(Date.now() + days * DAY))
const stampAgo = (days, hours = 0) => new Date(Date.now() - days * DAY - hours * 60 * 60 * 1000).toISOString()

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

// `art` picks the illustration used when `photos` is empty.
// `photos` holds URLs (e.g. '/images/sunrise.jpg' in /public) or uploaded images; the first is the cover.
// `coords` are approximate [latitude, longitude] for the map. `views` counts detail-page visits.
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
    photos: [],
    coords: [10.6792, 124.8011],
    views: 342,
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
    photos: [],
    coords: [10.6668, 124.8052],
    views: 128,
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
    photos: [],
    coords: [10.6779, 124.7999],
    views: 276,
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
    photos: [],
    coords: [10.7425, 124.7969],
    views: 301,
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
    photos: [],
    coords: [10.7462, 124.7958],
    views: 219,
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
    photos: [],
    coords: [10.6838, 124.8004],
    views: 187,
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
    photos: [],
    coords: [10.6655, 124.7988],
    views: 96,
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
    photos: [],
    coords: [10.6801, 124.8024],
    views: 154,
  },
]

export const LOCATIONS = [
  { id: 'poblacion', name: 'Poblacion', listings: 12, art: 0 },
  { id: 'san-isidro', name: 'San Isidro', listings: 8, art: 1 },
  { id: 'city-center', name: 'Baybay City Center', listings: 6, art: 2 },
  { id: 'near-vsu', name: 'Near VSU', listings: 5, art: 3 },
]

// The first five are the recent requests on Juan's dashboard; the rest is history for the charts.
const history = [
  ['r-100', 24, 'Mark Villanueva', 'city-view', 'Approved'],
  ['r-099', 33, 'Joy Santiago', 'sunrise', 'Declined'],
  ['r-098', 41, 'Paolo Ramos', 'riverside', 'Approved'],
  ['r-097', 52, 'Grace Lim', 'city-view', 'Cancelled'],
  ['r-096', 63, 'Kevin Tan', 'sunrise', 'Approved'],
  ['r-095', 75, 'Liza Navarro', 'riverside', 'Declined'],
  ['r-094', 88, 'Rico Aquino', 'sunrise', 'Approved'],
  ['r-093', 97, 'Bea Flores', 'city-view', 'Approved'],
  ['r-092', 112, 'Jun Castillo', 'riverside', 'Approved'],
  ['r-091', 128, 'Ella Ramirez', 'sunrise', 'Cancelled'],
  ['r-089', 141, 'Nina Torres', 'city-view', 'Approved'],
  ['r-088', 155, 'Arvin Dizon', 'riverside', 'Declined'],
  ['r-087', 168, 'Mica Reyes', 'sunrise', 'Approved'],
]

const ROOM_TYPE_OF = { sunrise: 'Single Room', riverside: 'Shared Room', 'city-view': 'Single Room' }

export const RESERVATIONS = [
  { id: 'r-105', date: daysAgo(2), boarderId: 'u-boarder-1', boarder: 'Maria Santos', listingId: 'sunrise', roomType: 'Single Room', moveIn: daysAhead(30), message: 'Hi! I’m an incoming 2nd year student at VSU. Is the room available next month?', status: 'Pending' },
  { id: 'r-104', date: daysAgo(3), boarderId: 'u-boarder-2', boarder: 'John Reyes', listingId: 'riverside', roomType: 'Shared Room', moveIn: daysAhead(14), message: '', status: 'Pending' },
  { id: 'r-103', date: daysAgo(5), boarderId: 'u-boarder-3', boarder: 'Ana Cruz', listingId: 'city-view', roomType: 'Single Room', moveIn: daysAgo(1), message: '', status: 'Approved' },
  { id: 'r-102', date: daysAgo(8), boarderId: 'u-boarder-4', boarder: 'Luis Garcia', listingId: 'sunrise', roomType: 'Single Room', moveIn: daysAgo(2), message: '', status: 'Approved' },
  { id: 'r-101', date: daysAgo(12), boarderId: 'u-boarder-5', boarder: 'Carla Mendoza', listingId: 'riverside', roomType: 'Shared Room', moveIn: daysAgo(5), message: '', status: 'Approved' },
  ...history.map(([id, days, boarder, listingId, status]) => ({
    id,
    date: daysAgo(days),
    boarderId: `u-past-${id}`,
    boarder,
    listingId,
    roomType: ROOM_TYPE_OF[listingId],
    moveIn: daysAgo(days - 10),
    message: '',
    status,
  })),
  // Maria's past stay, which lets her review Green Haven in the demo.
  { id: 'r-090', date: daysAgo(150), boarderId: 'u-boarder-1', boarder: 'Maria Santos', listingId: 'green-haven', roomType: 'Single Room', moveIn: daysAgo(140), message: '', status: 'Approved' },
]

export const NOTIFICATIONS = [
  { id: 'n-1', userId: 'u-boarder-1', date: stampAgo(2, 2), title: 'Reservation request sent', body: 'Your request for Sunrise Boarding House is waiting for the landlord’s response.', link: '/boarder/reservations', read: false },
  { id: 'n-2', userId: 'u-boarder-1', date: stampAgo(3, 5), title: 'New listing near VSU', body: 'Green Haven Residences has single rooms from ₱2,800/month.', link: '/boarder/rooms/green-haven', read: false },
  { id: 'n-3', userId: 'u-boarder-1', date: stampAgo(4, 1), title: 'Saved listing almost full', body: 'City View Boarding House has only 1 room left.', link: '/boarder/rooms/city-view', read: false },
  { id: 'n-4', userId: 'u-landlord-1', date: stampAgo(2, 2), title: 'New reservation request', body: 'Maria Santos wants a Single Room at Sunrise Boarding House.', link: '/landlord/reservations', read: false },
  { id: 'n-5', userId: 'u-landlord-1', date: stampAgo(3, 6), title: 'New reservation request', body: 'John Reyes wants a Shared Room at Riverside Dormitory.', link: '/landlord/reservations', read: false },
  { id: 'n-6', userId: 'u-landlord-1', date: stampAgo(9), title: 'Listing approved', body: 'City View Boarding House is now visible to boarders.', link: '/landlord/listings/city-view', read: true },
]

const review = (id, listingId, name, rating, days, comment, reply) => ({
  id,
  listingId,
  userId: `u-reviewer-${id}`,
  name,
  rating,
  comment,
  date: stampAgo(days),
  reply: reply ? { text: reply, date: stampAgo(days - 1) } : null,
})

export const REVIEWS = [
  review('v-1', 'sunrise', 'Luis Garcia', 5, 1, 'Clean rooms and the owner responds quickly. Walking distance to the market and the jeepney terminal.', 'Thank you, Luis! Glad you’re settling in well.'),
  review('v-2', 'sunrise', 'Kevin Tan', 4, 40, 'Quiet place to study. Water pressure is a bit weak in the early morning though.'),
  review('v-3', 'sunrise', 'Rico Aquino', 5, 70, 'Felt safe here: CCTV in the hallway and the gate is locked at night.'),
  review('v-4', 'riverside', 'Paolo Ramos', 4, 30, 'Affordable, and the shared kitchen is a big plus for students on a budget.'),
  review('v-5', 'riverside', 'Jun Castillo', 3, 90, 'Okay for the price, but the 10 PM curfew is strict.'),
  review('v-6', 'city-view', 'Ana Cruz', 5, 0.5, 'The aircon and private CR are worth it. Great view of the town at night.'),
  review('v-7', 'city-view', 'Mark Villanueva', 5, 20, 'The landlord is kind and fixes things fast.'),
  review('v-8', 'city-view', 'Bea Flores', 4, 80, 'Very comfortable. A bit noisy on weekends because of the street below.'),
  review('v-9', 'green-haven', 'Kim Alvarez', 5, 15, 'Five minutes to VSU and the Wi-Fi in the study lounge is fast.'),
  review('v-10', 'green-haven', 'Rhea Bautista', 4, 45, 'Lots of trees around, very relaxing after classes.'),
  review('v-11', 'green-haven', 'Jomar Lee', 4, 95, 'Rooms are on the small side but always clean.'),
  review('v-12', 'vsu-bedspace', 'Carlo Mendoza', 4, 25, 'Cheapest option near the gate. Good for freshmen.'),
  review('v-13', 'vsu-bedspace', 'Andrea Uy', 3, 60, 'Gets crowded during exams, so bring earplugs.'),
  review('v-14', 'central-lodging', 'Patrick Go', 5, 18, 'Near the banks and malls, very convenient if you work in the city.'),
  review('v-15', 'central-lodging', 'Shiela Ramos', 4, 50, 'A bit pricey but fully furnished and well maintained.'),
  review('v-16', 'seaside', 'Leo Bautista', 4, 35, 'The sea breeze at night means you barely need a fan.'),
  review('v-17', 'seaside', 'Camille Tan', 4, 66, 'Shared kitchen is clean and well kept.'),
  review('v-18', 'poblacion-inn', 'Ivy Morales', 5, 12, 'My roommate and I each have our own desk. Perfect for students.'),
  review('v-19', 'poblacion-inn', 'Dan Ocampo', 4, 58, 'Close to printing shops and eateries.'),
]

export const CONVERSATIONS = [
  {
    id: 'c-1',
    listingId: 'sunrise',
    boarderId: 'u-boarder-1',
    boarderName: 'Maria Santos',
    landlordId: 'u-landlord-1',
    landlordName: 'Juan Dela Cruz',
    lastRead: { 'u-boarder-1': stampAgo(2, 1), 'u-landlord-1': stampAgo(0, 1) },
    messages: [
      { id: 'm-1', senderId: 'u-boarder-1', text: 'Hi po! Is the single room still available for next month?', date: stampAgo(2, 3) },
      { id: 'm-2', senderId: 'u-landlord-1', text: 'Hello Maria! Yes, we still have 2 rooms open. You’re welcome to visit this weekend.', date: stampAgo(1, 20) },
      { id: 'm-3', senderId: 'u-landlord-1', text: 'Water and electricity are included up to ₱300 a month, by the way.', date: stampAgo(1, 19) },
    ],
  },
  {
    id: 'c-2',
    listingId: 'riverside',
    boarderId: 'u-boarder-2',
    boarderName: 'John Reyes',
    landlordId: 'u-landlord-1',
    landlordName: 'Juan Dela Cruz',
    lastRead: { 'u-boarder-2': stampAgo(0, 3), 'u-landlord-1': stampAgo(1) },
    messages: [{ id: 'm-4', senderId: 'u-boarder-2', text: 'Good evening sir, is there a curfew in the dorm?', date: stampAgo(0, 3) }],
  },
]

export const INITIAL_FAVORITES = { 'u-boarder-1': ['sunrise', 'city-view'] }
export const INITIAL_RECENTLY_VIEWED = { 'u-boarder-1': ['green-haven'] }

// Approximate centers used for new listings and the map's starting view.
export const BAYBAY_CENTER = [10.6786, 124.8003]
export const VSU_COORDS = [10.7446, 124.7952]
export const AREA_CENTERS = {
  Poblacion: [10.6792, 124.8012],
  'San Isidro': [10.6662, 124.8045],
  'Baybay City Center': [10.6835, 124.8001],
  'Near VSU': [10.7435, 124.7962],
}

// Straight-line distance in kilometers (haversine).
export function distanceKm([lat1, lng1], [lat2, lng2]) {
  const rad = (value) => (value * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

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

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

// "just now", "5 minutes ago", "yesterday", then a date for anything older than a week.
export function timeAgo(isoDateTime) {
  const seconds = (new Date(isoDateTime).getTime() - Date.now()) / 1000
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24
  if (Math.abs(minutes) < 1) return 'just now'
  if (Math.abs(hours) < 1) return relative.format(Math.round(minutes), 'minute')
  if (Math.abs(days) < 1) return relative.format(Math.round(hours), 'hour')
  if (Math.abs(days) < 7) return relative.format(Math.round(days), 'day')
  return formatDate(isoDateTime)
}
