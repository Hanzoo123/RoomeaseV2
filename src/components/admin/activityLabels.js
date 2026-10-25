import { Ban, CalendarCheck, CalendarX, CircleCheck, CircleX, FilePen, FilePlus, RotateCcw, Trash2, UserCheck, UserPlus, UserX } from 'lucide-react'

// Readable wording for each activity log action ("listing.approved" → "approved a listing").
export const ACTIVITY = {
  'listing.submitted': { text: 'submitted a new listing', icon: FilePlus, tone: 'primary', group: 'listings' },
  'listing.resubmitted': { text: 'resubmitted a listing after changes', icon: FilePen, tone: 'primary', group: 'listings' },
  'listing.updated': { text: 'updated a listing', icon: FilePen, tone: 'secondary', group: 'listings' },
  'listing.approved': { text: 'approved a listing', icon: CircleCheck, tone: 'success', group: 'listings' },
  'listing.rejected': { text: 'sent a listing back for changes', icon: CircleX, tone: 'danger', group: 'listings' },
  'listing.removed': { text: 'removed a listing', icon: Ban, tone: 'danger', group: 'listings' },
  'listing.restored': { text: 'restored a listing', icon: RotateCcw, tone: 'success', group: 'listings' },
  'listing.deleted': { text: 'deleted a listing', icon: Trash2, tone: 'danger', group: 'listings' },
  'reservation.approved': { text: 'approved a reservation', icon: CalendarCheck, tone: 'success', group: 'reservations' },
  'reservation.declined': { text: 'declined a reservation', icon: CalendarX, tone: 'danger', group: 'reservations' },
  'reservation.cancelled': { text: 'cancelled a reservation', icon: CalendarX, tone: 'secondary', group: 'reservations' },
  'user.created': { text: 'created an account', icon: UserPlus, tone: 'primary', group: 'users' },
  'user.deactivated': { text: 'deactivated an account', icon: UserX, tone: 'danger', group: 'users' },
  'user.activated': { text: 'reactivated an account', icon: UserCheck, tone: 'success', group: 'users' },
}

export const ACTIVITY_GROUPS = { listings: 'Listings', reservations: 'Reservations', users: 'Accounts' }

export function activityInfo(action) {
  return ACTIVITY[action] ?? { text: action, icon: FilePen, tone: 'secondary', group: 'other' }
}

// Where an entry's target opens in the admin panel.
export function activityLink(entry) {
  if (entry.targetType === 'listing') return `/admin/listings/${entry.targetId}`
  if (entry.targetType === 'user') return `/admin/users?q=${encodeURIComponent(entry.targetLabel)}`
  return null
}
