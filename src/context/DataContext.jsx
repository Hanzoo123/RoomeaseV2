import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ACTIVITY,
  AREA_CENTERS,
  BAYBAY_CENTER,
  CONTACT_MESSAGES,
  CONVERSATIONS,
  INITIAL_FAVORITES,
  INITIAL_RECENTLY_VIEWED,
  LISTINGS,
  NOTIFICATIONS,
  OTHER_LANDLORDS,
  RESERVATIONS,
  REVIEWS,
  SHARED_ROOM_TYPES,
} from '../data/mockData'
import { loadJSON, newId, saveJSON } from '../data/storage'
import { useAuth } from './AuthContext'

// Stand-in for a backend: all app data lives here and is saved to localStorage,
// so both roles see the same listings, reservations, reviews and messages in this browser.
// Other tabs pick up changes through the `storage` event, so two signed-in tabs stay in sync.
const DATA_KEY = 'roomease.data.v3'
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
    activity: ACTIVITY,
    contactMessages: CONTACT_MESSAGES,
  }
}

// Fills in fields added after a listing was saved, so older saved data keeps working.
function normalizeListing(listing) {
  return {
    ...listing,
    photos: listing.photos ?? (listing.photo ? [listing.photo] : []),
    coords: listing.coords ?? AREA_CENTERS[listing.area] ?? BAYBAY_CENTER,
    views: listing.views ?? 0,
    approval: listing.approval ?? 'Pending',
    removed: listing.removed ?? false,
    rejectionReason: listing.rejectionReason ?? null,
    houseRules: listing.houseRules ?? [],
    utilities: listing.utilities ?? [],
    paymentMethods: listing.paymentMethods ?? [],
    genderPolicy: listing.genderPolicy ?? 'any',
    curfew: listing.curfew ?? null,
    minimumStayMonths: listing.minimumStayMonths ?? null,
    visitorsAllowed: listing.visitorsAllowed ?? null,
    petsAllowed: listing.petsAllowed ?? null,
    cookingAllowed: listing.cookingAllowed ?? null,
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

// One audit-log entry. `targetLabel` keeps the name as it was, so the log still reads well after a rename.
function logEntry(actor, action, targetType, targetId, targetLabel, detail = null) {
  return {
    id: newId('a'),
    date: now(),
    actorId: actor?.id ?? null,
    actorName: actor?.name ?? 'System',
    actorRole: actor?.role ?? 'system',
    action,
    targetType,
    targetId,
    targetLabel,
    detail,
  }
}

const withLog = (activity, entry) => [entry, ...activity].slice(0, 400)
const ADMINS = 'role:admin'

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
    (actor, reservationId, status, note = '') =>
      update(({ reservations, notifications, listings, activity }) => {
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
                  : `${listingName} declined your request${note ? `: “${note}”` : '.'} You can browse other rooms.`,
                '/boarder/reservations',
              )
        return {
          reservations: reservations.map((item) =>
            item.id === reservationId ? { ...item, status, landlordNote: status === 'Declined' ? note || null : item.landlordNote ?? null, decidedAt: now() } : item,
          ),
          notifications: [message, ...notifications],
          activity: withLog(activity, logEntry(actor, `reservation.${status.toLowerCase()}`, 'reservation', reservationId, `${reservation.boarder} · ${listingName}`, note || null)),
        }
      }),
    [update],
  )

  // New listings go to the admin queue. Editing a listing that was sent back resubmits it.
  const saveListing = useCallback(
    (actor, fields, listingId) => {
      const id = listingId ?? newId('l')
      update(({ listings, notifications, activity }) => {
        if (listingId) {
          const existing = listings.find((item) => item.id === listingId)
          if (!existing) return {}
          const resubmit = existing.approval === 'Rejected'
          return {
            listings: listings.map((item) =>
              item.id === listingId ? { ...item, ...fields, ...(resubmit ? { approval: 'Pending', rejectionReason: null, submittedAt: now(), moderatedAt: null } : {}) } : item,
            ),
            notifications: resubmit
              ? [notification(ADMINS, 'Listing resubmitted', `${actor.name} updated ${fields.name} after it was sent back.`, `/admin/listings/${listingId}`), ...notifications]
              : notifications,
            activity: withLog(activity, logEntry(actor, resubmit ? 'listing.resubmitted' : 'listing.updated', 'listing', listingId, fields.name)),
          }
        }
        const listing = normalizeListing({
          ...fields,
          id,
          ownerId: actor.id,
          city: 'Baybay City',
          approval: 'Pending',
          submittedAt: now(),
          views: 0,
          art: { house: listings.length % 3, room: SHARED_ROOM_TYPES.includes(fields.roomType) ? 'bunk' : 'single' },
        })
        return {
          listings: [listing, ...listings],
          notifications: [
            notification(actor.id, 'Listing submitted for review', `${fields.name} will be visible to boarders once an admin approves it.`, `/landlord/listings/${id}`),
            notification(ADMINS, 'New listing to review', `${actor.name} submitted ${fields.name}.`, `/admin/listings/${id}`),
            ...notifications,
          ],
          activity: withLog(activity, logEntry(actor, 'listing.submitted', 'listing', id, fields.name)),
        }
      })
      return id
    },
    [update],
  )

  // For actions that live outside this store (e.g. deactivating an account in AuthContext).
  const logEvent = useCallback(
    (actor, action, targetType, targetId, targetLabel, detail) =>
      update(({ activity }) => ({ activity: withLog(activity, logEntry(actor, action, targetType, targetId, targetLabel, detail)) })),
    [update],
  )

  const sendContactMessage = useCallback(
    (fields) =>
      update(({ contactMessages, notifications }) => ({
        contactMessages: [{ id: newId('cm'), date: now(), read: false, ...fields }, ...contactMessages],
        notifications: [notification(ADMINS, 'New contact message', `${fields.name}: ${fields.topic}`, '/admin/inbox'), ...notifications],
      })),
    [update],
  )

  const deleteListing = useCallback(
    (actor, listingId) =>
      update(({ listings, activity }) => {
        const listing = listings.find((item) => item.id === listingId)
        return {
          listings: listings.filter((item) => item.id !== listingId),
          activity: withLog(activity, logEntry(actor, 'listing.deleted', 'listing', listingId, listing?.name ?? 'Listing')),
        }
      }),
    [update],
  )

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
    (userIds) => update(({ notifications }) => ({ notifications: notifications.map((item) => (userIds.includes(item.userId) ? { ...item, read: true } : item)) })),
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
    const { listings, reservations, notifications, reviews, conversations, favorites, recentlyViewed, compare, preferences, activity, contactMessages } = state
    const userId = user?.id
    // Personal notifications plus ones sent to the whole role (e.g. every admin).
    const myNotificationIds = user ? [user.id, `role:${user.role}`] : []
    const myNotifications = notifications.filter((item) => myNotificationIds.includes(item.userId))
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

    // Guests can compare rooms too; their picks are kept under "guest".
    const compareKey = userId ?? 'guest'
    const myCompare = (compare[compareKey] ?? []).filter((id) => listings.some((item) => item.id === id && item.approval === 'Approved' && !item.removed))

    return {
      listings,
      reservations,
      reviews,
      // Boarders only see listings an admin has approved.
      publicListings: listings.filter((item) => item.approval === 'Approved' && !item.removed),
      activity,
      contactMessages,
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
      recordView: (listingId) => recordView(compareKey, listingId),
      toggleCompare: (listingId) => toggleCompare(compareKey, listingId),
      clearCompare: () => clearCompare(compareKey),
      createReservation,
      setReservationStatus: (reservationId, status, note) => setReservationStatus(user, reservationId, status, note),
      saveListing: (fields, listingId) => saveListing(user, fields, listingId),
      deleteListing: (listingId) => deleteListing(user, listingId),
      // For the moment right after sign-up, before the new account is the signed-in user.
      logEventAs: logEvent,
      sendContactMessage,
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
      markAllRead: () => markAllRead(myNotificationIds),
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
    logEvent,
    sendContactMessage,
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
