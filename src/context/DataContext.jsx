import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  AREA_CENTERS,
  BAYBAY_CENTER,
  CONVERSATIONS,
  INITIAL_FAVORITES,
  INITIAL_RECENTLY_VIEWED,
  LISTINGS,
  NOTIFICATIONS,
  OTHER_LANDLORDS,
  RESERVATIONS,
  REVIEWS,
} from '../data/mockData'
import { loadJSON, newId, saveJSON } from '../data/storage'
import { useAuth } from './AuthContext'

// Stand-in for a backend: all app data lives here and is saved to localStorage,
// so both roles see the same listings, reservations, reviews and messages in this browser.
// Other tabs pick up changes through the `storage` event, so two signed-in tabs stay in sync.
const DATA_KEY = 'roomease.data.v2'
const DataContext = createContext(null)

const DEFAULT_PREFERENCES = { emailUpdates: true, reservationAlerts: true, listingTips: false }
export const MAX_COMPARE = 3

function seedState() {
  return {
    listings: LISTINGS,
    reservations: RESERVATIONS,
    notifications: NOTIFICATIONS,
    reviews: REVIEWS,
    conversations: CONVERSATIONS,
    favorites: INITIAL_FAVORITES,
    recentlyViewed: INITIAL_RECENTLY_VIEWED,
    compare: {},
    preferences: {},
  }
}

// Fills in fields added after a listing was saved, so older saved data keeps working.
function normalizeListing(listing) {
  return {
    ...listing,
    photos: listing.photos ?? (listing.photo ? [listing.photo] : []),
    coords: listing.coords ?? AREA_CENTERS[listing.area] ?? BAYBAY_CENTER,
    views: listing.views ?? 0,
  }
}

function hydrate(saved) {
  const state = { ...seedState(), ...saved }
  return { ...state, listings: state.listings.map(normalizeListing) }
}

const now = () => new Date().toISOString()
// Local calendar date (YYYY-MM-DD), not UTC.
const today = () => new Date().toLocaleDateString('en-CA')

function notification(userId, title, body, link) {
  return { id: newId('n'), userId, date: now(), title, body, link, read: false }
}

function lastMessageDate(conversation) {
  return conversation.messages.at(-1)?.date ?? ''
}

export function DataProvider({ children }) {
  const { user, findAccount } = useAuth()
  const [state, setState] = useState(() => hydrate(loadJSON(DATA_KEY, {})))
  const fromOtherTab = useRef(false)

  useEffect(() => {
    if (fromOtherTab.current) {
      fromOtherTab.current = false
      return
    }
    if (!saveJSON(DATA_KEY, state)) window.dispatchEvent(new Event('roomease:storage-full'))
  }, [state])

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== DATA_KEY || !event.newValue) return
      try {
        fromOtherTab.current = true
        setState(hydrate(JSON.parse(event.newValue)))
      } catch {
        fromOtherTab.current = false
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

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

  // Counts a view only when the boarder opens a different listing than last time.
  const recordView = useCallback(
    (userId, listingId) =>
      update(({ recentlyViewed, listings }) => {
        const mine = recentlyViewed[userId] ?? []
        if (mine[0] === listingId) return {}
        return {
          recentlyViewed: { ...recentlyViewed, [userId]: [listingId, ...mine.filter((id) => id !== listingId)].slice(0, 10) },
          listings: listings.map((item) => (item.id === listingId ? { ...item, views: item.views + 1 } : item)),
        }
      }),
    [update],
  )

  const toggleCompare = useCallback(
    (userId, listingId) =>
      update(({ compare }) => {
        const mine = compare[userId] ?? []
        if (mine.includes(listingId)) return { compare: { ...compare, [userId]: mine.filter((id) => id !== listingId) } }
        if (mine.length >= MAX_COMPARE) return {}
        return { compare: { ...compare, [userId]: [...mine, listingId] } }
      }),
    [update],
  )

  const clearCompare = useCallback((userId) => update(({ compare }) => ({ compare: { ...compare, [userId]: [] } })), [update])

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
        const listing = normalizeListing({
          ...fields,
          id,
          ownerId,
          city: 'Baybay City',
          approval: 'Pending',
          views: 0,
          art: { house: listings.length % 3, room: fields.roomType === 'Shared Room' ? 'bunk' : 'single' },
        })
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

  const deleteListing = useCallback((listingId) => update(({ listings }) => ({ listings: listings.filter((item) => item.id !== listingId) })), [update])

  const updateListing = useCallback(
    (listingId, changes) => update(({ listings }) => ({ listings: listings.map((item) => (item.id === listingId ? { ...item, ...changes } : item)) })),
    [update],
  )

  // One review per boarder per listing; saving again edits it.
  const saveReview = useCallback(
    (author, listing, { rating, comment }) =>
      update(({ reviews, notifications }) => {
        const existing = reviews.find((item) => item.listingId === listing.id && item.userId === author.id)
        if (existing) {
          return { reviews: reviews.map((item) => (item.id === existing.id ? { ...item, rating, comment, date: now() } : item)) }
        }
        const created = { id: newId('v'), listingId: listing.id, userId: author.id, name: author.name, rating, comment, date: now(), reply: null }
        return {
          reviews: [created, ...reviews],
          notifications: [
            notification(listing.ownerId, 'New review', `${author.name} rated ${listing.name} ${rating} out of 5.`, `/landlord/listings/${listing.id}`),
            ...notifications,
          ],
        }
      }),
    [update],
  )

  const deleteReview = useCallback((reviewId) => update(({ reviews }) => ({ reviews: reviews.filter((item) => item.id !== reviewId) })), [update])

  const replyToReview = useCallback(
    (reviewId, text) =>
      update(({ reviews }) => ({
        reviews: reviews.map((item) => (item.id === reviewId ? { ...item, reply: text ? { text, date: now() } : null } : item)),
      })),
    [update],
  )

  // Returns the conversation id for this boarder and listing, creating it if needed.
  const startConversation = useCallback(
    ({ listing, boarderId, boarderName, landlordName }, existing) => {
      if (existing) return existing.id
      const id = newId('c')
      update(({ conversations }) => ({
        conversations: [
          { id, listingId: listing.id, boarderId, boarderName, landlordId: listing.ownerId, landlordName, lastRead: {}, messages: [] },
          ...conversations,
        ],
      }))
      return id
    },
    [update],
  )

  const sendMessage = useCallback(
    (senderId, conversationId, text) =>
      update(({ conversations }) => {
        const date = now()
        return {
          conversations: conversations.map((item) =>
            item.id === conversationId
              ? { ...item, messages: [...item.messages, { id: newId('m'), senderId, text, date }], lastRead: { ...item.lastRead, [senderId]: date } }
              : item,
          ),
        }
      }),
    [update],
  )

  const markConversationRead = useCallback(
    (userId, conversationId) =>
      update(({ conversations }) => {
        const conversation = conversations.find((item) => item.id === conversationId)
        const latest = conversation && lastMessageDate(conversation)
        if (!conversation || !latest || (conversation.lastRead[userId] ?? '') >= latest) return {}
        return {
          conversations: conversations.map((item) => (item.id === conversationId ? { ...item, lastRead: { ...item.lastRead, [userId]: latest } } : item)),
        }
      }),
    [update],
  )

  const markNotificationRead = useCallback(
    (notificationId) =>
      update(({ notifications }) => ({ notifications: notifications.map((item) => (item.id === notificationId ? { ...item, read: true } : item)) })),
    [update],
  )

  const markAllRead = useCallback(
    (userId) => update(({ notifications }) => ({ notifications: notifications.map((item) => (item.userId === userId ? { ...item, read: true } : item)) })),
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
    const { listings, reservations, notifications, reviews, conversations, favorites, recentlyViewed, compare, preferences } = state
    const userId = user?.id
    const myNotifications = notifications.filter((item) => item.userId === userId)
    const myListingIds = new Set(listings.filter((item) => item.ownerId === userId).map((item) => item.id))

    const listingById = (id) => listings.find((item) => item.id === id)
    const ownerOf = (listing) => {
      const account = findAccount(listing.ownerId)
      return account ? { name: account.name, phone: account.phone, email: account.email } : (OTHER_LANDLORDS[listing.ownerId] ?? { name: 'Landlord' })
    }

    const ratingTotals = {}
    for (const item of reviews) {
      const total = (ratingTotals[item.listingId] ??= { sum: 0, count: 0 })
      total.sum += item.rating
      total.count += 1
    }
    const ratingOf = (listingId) => {
      const total = ratingTotals[listingId]
      return total ? { average: total.sum / total.count, count: total.count } : { average: 0, count: 0 }
    }

    const myConversations = conversations
      .filter((item) => item.boarderId === userId || item.landlordId === userId)
      .map((item) => {
        const read = item.lastRead[userId] ?? ''
        const unread = item.messages.filter((message) => message.senderId !== userId && message.date > read).length
        const isBoarder = item.boarderId === userId
        return { ...item, unread, otherName: isBoarder ? item.landlordName : item.boarderName, listing: listingById(item.listingId) }
      })
      .sort((a, b) => lastMessageDate(b).localeCompare(lastMessageDate(a)))

    const myCompare = (compare[userId] ?? []).filter((id) => listings.some((item) => item.id === id && item.approval === 'Approved'))

    return {
      listings,
      reservations,
      reviews,
      // Boarders only see listings an admin has approved.
      publicListings: listings.filter((item) => item.approval === 'Approved'),
      myListings: listings.filter((item) => item.ownerId === userId),
      myReservations: reservations.filter((item) => item.boarderId === userId),
      incomingReservations: reservations.filter((item) => myListingIds.has(item.listingId)),
      notifications: myNotifications,
      conversations: myConversations,
      favorites: favorites[userId] ?? [],
      recentlyViewed: recentlyViewed[userId] ?? [],
      compare: myCompare,
      preferences: { ...DEFAULT_PREFERENCES, ...preferences[userId] },
      listingById,
      ownerOf,
      ratingOf,
      reviewsFor: (listingId) => reviews.filter((item) => item.listingId === listingId).sort((a, b) => b.date.localeCompare(a.date)),
      // Only boarders who stayed (an approved reservation) can review a listing.
      canReview: (listingId) => reservations.some((item) => item.boarderId === userId && item.listingId === listingId && item.status === 'Approved'),
      counts: {
        notifications: myNotifications.filter((item) => !item.read).length,
        pendingReservations: reservations.filter((item) => myListingIds.has(item.listingId) && item.status === 'Pending').length,
        messages: myConversations.reduce((sum, item) => sum + item.unread, 0),
      },
      toggleFavorite: (listingId) => toggleFavorite(userId, listingId),
      recordView: (listingId) => recordView(userId, listingId),
      toggleCompare: (listingId) => toggleCompare(userId, listingId),
      clearCompare: () => clearCompare(userId),
      createReservation,
      setReservationStatus,
      saveListing: (fields, listingId) => saveListing(userId, fields, listingId),
      deleteListing,
      updateListing,
      saveReview: (listing, fields) => saveReview(user, listing, fields),
      deleteReview,
      replyToReview,
      startConversation: (details) =>
        startConversation(
          details,
          conversations.find((item) => item.listingId === details.listing.id && item.boarderId === details.boarderId),
        ),
      sendMessage: (conversationId, text) => sendMessage(userId, conversationId, text),
      markConversationRead: (conversationId) => markConversationRead(userId, conversationId),
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
    toggleCompare,
    clearCompare,
    createReservation,
    setReservationStatus,
    saveListing,
    deleteListing,
    updateListing,
    saveReview,
    deleteReview,
    replyToReview,
    startConversation,
    sendMessage,
    markConversationRead,
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
