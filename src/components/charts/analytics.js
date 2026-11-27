// Numbers behind the landlord charts, computed from the landlord's listings and requests
// (with the API, from GET /landlord/listings and /landlord/reservations).

export const STATUS_ORDER = ['Approved', 'Pending', 'Declined', 'Cancelled']

// Fixed status colors (never reused for other series). Always shown with labels.
export const STATUS_COLORS = {
  light: { Approved: '#0ca30c', Pending: '#fab219', Declined: '#d03b3b', Cancelled: '#8a94a6' },
  dark: { Approved: '#0ca30c', Pending: '#fab219', Declined: '#d03b3b', Cancelled: '#7c8597' },
}

const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' })

export function lastMonths(count = 6) {
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1)
    return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, label: monthLabel.format(date) }
  })
}

export function landlordAnalytics({ listings, reservations, reviews }) {
  const months = lastMonths(6)
  const perMonth = Object.fromEntries(STATUS_ORDER.map((status) => [status, months.map(() => 0)]))
  for (const reservation of reservations) {
    const index = months.findIndex((month) => reservation.date.startsWith(month.key))
    if (index >= 0) perMonth[reservation.status][index] += 1
  }

  const statusTotals = Object.fromEntries(STATUS_ORDER.map((status) => [status, reservations.filter((item) => item.status === status).length]))
  const decided = statusTotals.Approved + statusTotals.Declined
  const totalRooms = listings.reduce((sum, listing) => sum + listing.totalRooms, 0)
  const occupiedRooms = listings.reduce((sum, listing) => sum + (listing.totalRooms - listing.availableRooms), 0)
  const listingIds = new Set(listings.map((listing) => listing.id))
  const myReviews = reviews.filter((item) => listingIds.has(item.listingId))
  // With the API each listing carries its rating ({ average, count }); the demo counts reviews.
  const ratingOf = (listing) => {
    if (listing.rating) return listing.rating
    const own = myReviews.filter((item) => item.listingId === listing.id)
    return { average: own.length ? own.reduce((sum, item) => sum + item.rating, 0) / own.length : 0, count: own.length }
  }
  const ratings = listings.map(ratingOf)
  const reviewCount = ratings.reduce((sum, rating) => sum + rating.count, 0)

  const perListing = listings.map((listing) => {
    const requests = reservations.filter((item) => item.listingId === listing.id)
    const rating = ratingOf(listing)
    const approved = requests.filter((item) => item.status === 'Approved').length
    const declined = requests.filter((item) => item.status === 'Declined').length
    return {
      listing,
      occupancy: listing.totalRooms ? Math.round(((listing.totalRooms - listing.availableRooms) / listing.totalRooms) * 100) : 0,
      views: listing.views,
      requests: requests.length,
      approvalRate: approved + declined ? Math.round((approved / (approved + declined)) * 100) : null,
      rating: rating.count ? rating.average : null,
      reviewCount: rating.count,
    }
  })

  return {
    months,
    perMonth,
    statusTotals,
    perListing,
    kpis: {
      occupancy: totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      occupiedRooms,
      totalRooms,
      approvalRate: decided ? Math.round((statusTotals.Approved / decided) * 100) : 0,
      averageRating: reviewCount ? ratings.reduce((sum, rating) => sum + rating.average * rating.count, 0) / reviewCount : 0,
      reviewCount,
      totalViews: listings.reduce((sum, listing) => sum + listing.views, 0),
      totalRequests: reservations.length,
    },
  }
}
