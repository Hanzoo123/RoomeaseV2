import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  INITIAL_FAVORITES,
  INITIAL_RECENTLY_VIEWED,
  LISTINGS,
  NOTIFICATIONS,
  OTHER_LANDLORDS,
  RESERVATIONS,
} from '../data/mockData'
import { loadJSON, newId, saveJSON } from '../data/storage'
import { useAuth } from './AuthContext'

// Stand-in for a backend: all app data lives here and is saved to localStorage,
// so both roles see the same listings, reservations and notifications in this browser.
const DATA_KEY = 'roomease.data.v1'
const DataContext = createContext(null)

const DEFAULT_PREFERENCES = { emailUpdates: true, reservationAlerts: true, listingTips: false }

function seedState() {
  return {
    listings: LISTINGS,
    reservations: RESERVATIONS,
    notifications: NOTIFICATIONS,
    favorites: INITIAL_FAVORITES,
    recentlyViewed: INITIAL_RECENTLY_VIEWED,
    preferences: {},
  }
}

const now = () => new Date().toISOString()
// Local calendar date (YYYY-MM-DD), not UTC.
const today = () => new Date().toLocaleDateString('en-CA')

function notification(userId, title, body, link) {
  return { id: newId('n'), userId, date: now(), title, body, link, read: false }
}

export function DataProvider({ children }) {
  const { user, findAccount } = useAuth()
  const [state, setState] = useState(() => ({ ...seedState(), ...loadJSON(DATA_KEY, {}) }))
  useEffect(() => {
    saveJSON(DATA_KEY, state)
  }, [state])

  // Recipes return only the slices they change; returning {} leaves state untouched (no re-render).
  const update = useCallback(
    (recipe) =>
      setState((current) => {
        const changes = recipe(current)
        return Object.keys(changes).length ? { ...current, ...changes } : current
      }),
    [],
  )

  const toggleFavorite = useCallback(
    (userId, listingId) =>
      update(({ favorites }) => {
        const mine = favorites[userId] ?? []
        const next = mine.includes(listingId) ? mine.filter((id) => id !== listingId) : [...mine, listingId]
        return { favorites: { ...favorites, [userId]: next } }
      }),
    [update],
  )

  const recordView = useCallback(
    (userId, listingId) =>
      update(({ recentlyViewed }) => {
        const mine = recentlyViewed[userId] ?? []
        if (mine[0] === listingId) return {}
        return { recentlyViewed: { ...recentlyViewed, [userId]: [listingId, ...mine.filter((id) => id !== listingId)].slice(0, 10) } }
      }),
    [update],
  )

  const createReservation = useCallback(
    ({ boarder, listing, roomType, moveIn, message }) =>
      update(({ reservations, notifications }) => {
        const reservation = {
          id: newId('r'),
          date: today(),
          boarderId: boarder.id,
          boarder: boarder.name,
          listingId: listing.id,
          roomType,
          moveIn,
          message,
          status: 'Pending',
        }
        return {
          reservations: [reservation, ...reservations],
          notifications: [
            notification(listing.ownerId, 'New reservation request', `${boarder.name} wants a ${roomType} at ${listing.name}.`, '/landlord/reservations'),
            notification(boarder.id, 'Reservation request sent', `Your request for ${listing.name} is waiting for the landlord’s response.`, '/boarder/reservations'),
            ...notifications,
          ],
        }
      }),
    [update],
  )

  const setReservationStatus = useCallback(
    (reservationId, status) =>
      update(({ reservations, notifications, listings }) => {
        const reservation = reservations.find((item) => item.id === reservationId)
        if (!reservation) return {}
        const listing = listings.find((item) => item.id === reservation.listingId)
        const listingName = listing?.name ?? 'the boarding house'
        const message =
          status === 'Cancelled'
            ? notification(listing?.ownerId, 'Reservation cancelled', `${reservation.boarder} cancelled their request for ${listingName}.`, '/landlord/reservations')
            : notification(
                reservation.boarderId,
                `Reservation ${status.toLowerCase()}`,
                status === 'Approved'
                  ? `Good news! ${listingName} approved your request. Contact the landlord to arrange your move-in.`
                  : `${listingName} declined your request. You can browse other rooms.`,
                '/boarder/reservations',
              )
        return {
          reservations: reservations.map((item) => (item.id === reservationId ? { ...item, status } : item)),
          notifications: [message, ...notifications],
        }
      }),
    [update],
  )

  const saveListing = useCallback(
    (ownerId, fields, listingId) => {
      const id = listingId ?? newId('l')
      update(({ listings, notifications }) => {
        if (listingId) {
          return { listings: listings.map((item) => (item.id === listingId ? { ...item, ...fields } : item)) }
        }
        const listing = { ...fields, id, ownerId, city: 'Baybay City', approval: 'Pending', art: { house: listings.length % 3, room: fields.roomType === 'Shared Room' ? 'bunk' : 'single' } }
        return {
          listings: [listing, ...listings],
          notifications: [
            notification(ownerId, 'Listing submitted for review', `${fields.name} will be visible to boarders once an admin approves it.`, `/landlord/listings/${id}`),
            ...notifications,
          ],
        }
      })
      return id
    },
    [update],
  )

  const deleteListing = useCallback(
    (listingId) => update(({ listings }) => ({ listings: listings.filter((item) => item.id !== listingId) })),
    [update],
  )

  const updateListing = useCallback(
    (listingId, changes) =>
      update(({ listings }) => ({ listings: listings.map((item) => (item.id === listingId ? { ...item, ...changes } : item)) })),
    [update],
  )

  const markNotificationRead = useCallback(
    (notificationId) =>
      update(({ notifications }) => ({ notifications: notifications.map((item) => (item.id === notificationId ? { ...item, read: true } : item)) })),
    [update],
  )

  const markAllRead = useCallback(
    (userId) =>
      update(({ notifications }) => ({ notifications: notifications.map((item) => (item.userId === userId ? { ...item, read: true } : item)) })),
    [update],
  )

  const deleteNotification = useCallback(
    (notificationId) => update(({ notifications }) => ({ notifications: notifications.filter((item) => item.id !== notificationId) })),
    [update],
  )

  const setPreferences = useCallback(
    (userId, changes) =>
      update(({ preferences }) => ({ preferences: { ...preferences, [userId]: { ...DEFAULT_PREFERENCES, ...preferences[userId], ...changes } } })),
    [update],
  )

  const resetDemoData = useCallback(() => setState(seedState()), [])

  const value = useMemo(() => {
    const { listings, reservations, notifications, favorites, recentlyViewed, preferences } = state
    const userId = user?.id
    const myNotifications = notifications.filter((item) => item.userId === userId)
    const myListingIds = new Set(listings.filter((item) => item.ownerId === userId).map((item) => item.id))

    const listingById = (id) => listings.find((item) => item.id === id)
    const ownerOf = (listing) => {
      const account = findAccount(listing.ownerId)
      return account ? { name: account.name, phone: account.phone, email: account.email } : OTHER_LANDLORDS[listing.ownerId] ?? { name: 'Landlord' }
    }

    return {
      listings,
      reservations,
      // Boarders only see listings an admin has approved.
      publicListings: listings.filter((item) => item.approval === 'Approved'),
      myListings: listings.filter((item) => item.ownerId === userId),
      myReservations: reservations.filter((item) => item.boarderId === userId),
      incomingReservations: reservations.filter((item) => myListingIds.has(item.listingId)),
      notifications: myNotifications,
      favorites: favorites[userId] ?? [],
      recentlyViewed: recentlyViewed[userId] ?? [],
      preferences: { ...DEFAULT_PREFERENCES, ...preferences[userId] },
      listingById,
      ownerOf,
      counts: {
        notifications: myNotifications.filter((item) => !item.read).length,
        pendingReservations: reservations.filter((item) => myListingIds.has(item.listingId) && item.status === 'Pending').length,
      },
      toggleFavorite: (listingId) => toggleFavorite(userId, listingId),
      recordView: (listingId) => recordView(userId, listingId),
      createReservation,
      setReservationStatus,
      saveListing: (fields, listingId) => saveListing(userId, fields, listingId),
      deleteListing,
      updateListing,
      markNotificationRead,
      markAllRead: () => markAllRead(userId),
      deleteNotification,
      setPreferences: (changes) => setPreferences(userId, changes),
      resetDemoData,
    }
  }, [
    state,
    user,
    findAccount,
    toggleFavorite,
    recordView,
    createReservation,
    setReservationStatus,
    saveListing,
    deleteListing,
    updateListing,
    markNotificationRead,
    markAllRead,
    deleteNotification,
    setPreferences,
    resetDemoData,
  ])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside <DataProvider>')
  return context
}
