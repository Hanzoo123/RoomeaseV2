import { Bell, CalendarCheck, CalendarDays, ChartColumn, CirclePlus, ClipboardList, Heart, House, MessageCircle, Search, Settings, User } from 'lucide-react'

// `badge` names a key in DataContext `counts[role]`.
export const NAVIGATION = {
  boarder: [
    { label: 'Dashboard', to: '/boarder', icon: House, end: true },
    { label: 'Browse Rooms', to: '/boarder/browse', icon: Search },
    { label: 'My Reservations', to: '/boarder/reservations', icon: CalendarCheck },
    { label: 'My Favorites', to: '/boarder/favorites', icon: Heart },
    { label: 'Messages', to: '/boarder/messages', icon: MessageCircle, badge: 'messages' },
    { label: 'Notifications', to: '/boarder/notifications', icon: Bell, badge: 'notifications' },
    { label: 'My Profile', to: '/boarder/profile', icon: User },
    { label: 'Settings', to: '/boarder/settings', icon: Settings },
  ],
  landlord: [
    { label: 'Dashboard', to: '/landlord', icon: House, end: true },
    { label: 'My Boarding Houses', to: '/landlord/listings', icon: ClipboardList },
    { label: 'Add New Listing', to: '/landlord/add-listing', icon: CirclePlus },
    { label: 'Room Availability', to: '/landlord/availability', icon: CalendarDays },
    { label: 'Reservation Requests', to: '/landlord/reservations', icon: CalendarCheck, badge: 'pendingReservations' },
    { label: 'Analytics', to: '/landlord/analytics', icon: ChartColumn },
    { label: 'Messages', to: '/landlord/messages', icon: MessageCircle, badge: 'messages' },
    { label: 'Notifications', to: '/landlord/notifications', icon: Bell, badge: 'notifications' },
    { label: 'My Profile', to: '/landlord/profile', icon: User },
    { label: 'Settings', to: '/landlord/settings', icon: Settings },
  ],
}

export const ROLE_META = {
  boarder: {
    label: 'Boarder',
    tagline: 'Find Your Perfect Room',
    searchPlaceholder: 'Search boarding houses...',
    sidebarCaption: ['Better Rooms', 'Brighter Future'],
  },
  landlord: {
    label: 'Landlord',
    tagline: 'Manage Your Properties',
    searchPlaceholder: 'Search your listings...',
    sidebarCaption: ['More Listings', 'More Opportunities'],
  },
}

// Admins and super admins sign in to the AdminLTE panel served by WAMP (backend/admin).
// Set VITE_ADMIN_URL in .env if the project sits in another folder under C:\wamp64\www.
export const ADMIN_PANEL_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost/RoomeaseV2/backend/admin/'
