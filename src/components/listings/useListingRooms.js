import { useEffect, useState } from 'react'
import { fetchListingRooms } from '../../api/listings'

// A listing's rooms, for its page: loaded from the API (again whenever its free beds change,
// e.g. after a landlord approves a request), or the demo listing's own.
// Returns { loading, rooms, error }.
export default function useListingRooms(listing) {
  const dbId = listing?.dbId
  const key = dbId ? `${dbId}:${listing.totalRooms}-${listing.availableRooms}-${listing.availableSlots}` : null
  const [state, setState] = useState({ key: null, rooms: [], error: '' })

  useEffect(() => {
    if (!key) return undefined
    let current = true
    fetchListingRooms(dbId).then((result) => {
      if (current) setState({ key, rooms: result.ok ? result.rooms : [], error: result.ok ? '' : result.error })
    })
    return () => {
      current = false
    }
  }, [key, dbId])

  if (!listing) return { loading: true, rooms: [], error: '' }
  if (!dbId) return { loading: false, rooms: listing.rooms ?? [], error: '' }
  // While newer numbers reload, the rooms already shown stay.
  const loaded = state.key?.startsWith(`${dbId}:`)
  return { loading: !loaded, rooms: loaded ? state.rooms : [], error: loaded ? state.error : '' }
}
