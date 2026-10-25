import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { BOARDER_SUMMARY, INITIAL_FAVORITES, LANDLORD_SUMMARY, LISTINGS, RESERVATIONS } from '../data/mockData'

const DataContext = createContext(null)

// Holds the state both the layout (badges) and the dashboards (stats) read from.
export function DataProvider({ children }) {
  const [favorites, setFavorites] = useState(INITIAL_FAVORITES)
  const [reservations, setReservations] = useState(RESERVATIONS)

  const toggleFavorite = useCallback((listingId) => {
    setFavorites((current) =>
      current.includes(listingId) ? current.filter((id) => id !== listingId) : [...current, listingId],
    )
  }, [])

  const setReservationStatus = useCallback((reservationId, status) => {
    setReservations((current) => current.map((item) => (item.id === reservationId ? { ...item, status } : item)))
  }, [])

  const value = useMemo(() => {
    const pendingReservations = reservations.filter((item) => item.status === 'Pending').length
    return {
      listings: LISTINGS,
      favorites,
      toggleFavorite,
      reservations,
      setReservationStatus,
      counts: {
        boarder: { notifications: BOARDER_SUMMARY.notifications },
        landlord: { notifications: LANDLORD_SUMMARY.notifications, pendingReservations },
      },
    }
  }, [favorites, toggleFavorite, reservations, setReservationStatus])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside <DataProvider>')
  return context
}
