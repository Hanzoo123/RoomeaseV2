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
import { countListingView, fetchPublicListings } from '../api/listings'
import { deleteMyListing, fetchMyListings, saveMyListing, updateMyRoom } from '../api/landlord'
import { cancelReservation, decideReservation, fetchFavorites, fetchIncomingReservations, fetchMyReservations, requestRoom, saveFavorite } from '../api/reservations'
import { roomsFromTotals, summarizeRooms } from '../data/rooms'
import { USE_API } from '../config/api'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import usePolled from './usePolled'

// Stand-in for a backend: app data lives here and is saved to localStorage, so both roles
// see the same listings, reservations, reviews and messages in this browser. Other tabs pick
// up changes through the `storage` event, so two signed-in tabs stay in sync.
// With the API on (USE_API), listings (phases 2–3), reservations, saved listings and reviews
// (phase 4) come from MySQL instead; messages and notifications still live here until phase 5.
const DATA_KEY = 'roomease.data.v3'
const DataContext = createContext(null)

const DEFAULT_PREFERENCES = { emailUpdates: true, reservationAlerts: true, listingTips: false }
export const MAX_COMPARE = 3
// The API's lists in the { ok, data } shape usePolled expects.
const loadPublicListings = async () => {
  const result = await fetchPublicListings()
  return result.ok ? { ok: true, data: result.listings } : result
}
const loadMyListings = async () => {
  const result = await fetchMyListings()
  return result.ok ? { ok: true, data: result.listings } : result
}

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
    roomTypes: listing.roomTypes ?? [listing.roomType],
    rooms: listing.rooms ?? roomsFromTotals(listing),
  }
}

function hydrate(saved) {
  const state = { ...seedState(), ...saved }
  return { ...state, listings: state.listings.map(normalizeListing) }
}

function withRoomChange(listing, roomId, changes) {
  const rooms = listing.rooms.map((room) => (room.id === roomId ? { ...room, ...changes } : room))
  return { ...listing, rooms, ...summarizeRooms(rooms) }
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
    ({ boarder, listing, room, moveIn, message }) =>
      update(({ reservations, notifications }) => {
        const roomType = room?.type ?? listing.roomType
        const reservation = {
          id: newId('r'),
          date: today(),
          boarderId: boarder.id,
          boarder: boarder.name,
          listingId: listing.id,
          roomId: room?.id ?? null,
          roomName: room?.name ?? null,
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
    (actor, form, listingId) => {
      const id = listingId ?? newId('l')
      const rooms = form.rooms.map((room) => (room.id ? room : { ...room, id: newId('r') }))
      const fields = { ...form, rooms, ...summarizeRooms(rooms) }
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

  // One room's occupied beds or open/closed, and the listing's totals with it.
  const updateRoom = useCallback(
    (listingId, roomId, changes) =>
      update(({ listings }) => ({ listings: listings.map((item) => (item.id === listingId ? withRoomChange(item, roomId, changes) : item)) })),
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

  // ---------- From the API (USE_API) ----------
  // Each list loads at start, when the tab regains focus and every minute (see usePolled), for
  // the account it belongs to. Writes wait for the API and then update the list they changed.
  const role = USE_API ? user?.role : null
  const isLandlord = role === 'landlord'
  const isBoarder = role === 'boarder'
  const publicApi = usePolled(USE_API ? 'public' : null, loadPublicListings)
  const mineApi = usePolled(isLandlord ? user.id : null, loadMyListings)
  const incomingApi = usePolled(isLandlord ? user.id : null, fetchIncomingReservations)
  const requestsApi = usePolled(isBoarder ? user.id : null, fetchMyReservations)
  const favoritesApi = usePolled(isBoarder ? user.id : null, fetchFavorites)
  const { reload: reloadPublic } = publicApi
  const { reload: reloadMine, mutate: mutateMine } = mineApi
  const { reload: reloadIncoming, mutate: mutateIncoming } = incomingApi
  const { mutate: mutateRequests } = requestsApi
  const { reload: reloadFavorites, mutate: mutateFavorites } = favoritesApi

  // Puts a listing the API just sent back in place (or first, if it's new).
  const putMine = useCallback(
    (listing) =>
      mutateMine((listings) => (listings.some((item) => item.dbId === listing.dbId) ? listings.map((item) => (item.dbId === listing.dbId ? listing : item)) : [listing, ...listings])),
    [mutateMine],
  )
  const putReservation = (mutate) => (reservation) => mutate((list) => (list.some((item) => item.id === reservation.id) ? list.map((item) => (item.id === reservation.id ? reservation : item)) : [reservation, ...list]))

  // Saving, deleting and room changes resolve to { ok, … } or { ok: false, error, fields }.
  const saveOwnListing = useCallback(
    async (actor, fields, existing) => {
      if (!USE_API) return { ok: true, id: saveListing(actor, fields, existing?.id), resubmitted: existing?.approval === 'Rejected' }
      const result = await saveMyListing(fields, existing)
      if (!result.ok) return result
      putMine(result.listing)
      reloadPublic()
      return { ok: true, id: result.listing.id, resubmitted: result.resubmitted }
    },
    [saveListing, putMine, reloadPublic],
  )

  const deleteOwnListing = useCallback(
    async (actor, listing) => {
      if (!USE_API) {
        deleteListing(actor, listing.id)
        return { ok: true }
      }
      const result = await deleteMyListing(listing)
      if (result.ok || result.status === 404) {
        mutateMine((listings) => listings.filter((item) => item.dbId !== listing.dbId))
        reloadPublic()
        return { ok: true }
      }
      return result
    },
    [deleteListing, mutateMine, reloadPublic],
  )

  // The change shows at once; the server's answer then replaces it (only the latest answer
  // per room counts, so quick clicks can't end up out of order).
  const roomRequests = useRef({})
  const updateOwnRoom = useCallback(
    async (listing, roomId, changes) => {
      if (!USE_API) {
        updateRoom(listing.id, roomId, changes)
        return { ok: true }
      }
      mutateMine((listings) => listings.map((item) => (item.dbId === listing.dbId ? withRoomChange(item, roomId, changes) : item)))
      const request = (roomRequests.current[roomId] ?? 0) + 1
      roomRequests.current[roomId] = request
      const result = await updateMyRoom(roomId, changes)
      if (roomRequests.current[roomId] !== request) return result
      if (result.ok) {
        putMine(result.listing)
        reloadPublic()
      } else {
        reloadMine()
      }
      return result
    },
    [updateRoom, mutateMine, putMine, reloadPublic, reloadMine],
  )

  // A boarder's request for one room. In the demo, the room is noted on the request.
  const requestReservation = useCallback(
    async (boarder, { listing, room, moveIn, message }) => {
      if (!USE_API) {
        createReservation({ boarder, listing, room, moveIn, message })
        return { ok: true }
      }
      const result = await requestRoom({ roomId: room.id, moveIn, message })
      if (result.ok) putReservation(mutateRequests)(result.reservation)
      return result
    },
    [createReservation, mutateRequests],
  )

  // Cancelled (by the boarder), or Approved / Declined (by the landlord, with an optional
  // reason). Approving takes a bed, so the landlord's rooms and the public counts reload.
  const changeReservation = useCallback(
    async (actor, reservation, status, note = '') => {
      if (!USE_API) {
        setReservationStatus(actor, reservation.id, status, note)
        return { ok: true }
      }
      if (status === 'Cancelled') {
        const result = await cancelReservation(reservation)
        if (result.ok) putReservation(mutateRequests)(result.reservation)
        return result
      }
      const result = await decideReservation(reservation, status === 'Approved' ? 'accept' : 'decline', note)
      if (result.ok) {
        putReservation(mutateIncoming)(result.reservation)
        if (status === 'Approved') {
          reloadMine()
          reloadPublic()
        }
      } else if (result.status === 409) {
        // The boarder cancelled meanwhile, or the room filled up: show what is true now.
        reloadIncoming()
      }
      return result
    },
    [setReservationStatus, mutateRequests, mutateIncoming, reloadMine, reloadPublic, reloadIncoming],
  )

  // Saved listings are kept by MySQL id; the heart changes at once and is put back if the
  // server says no.
  const toast = useToast()
  const toggleSaved = useCallback(
    async (listing, saved) => {
      mutateFavorites((ids) => (saved ? [listing.dbId, ...ids.filter((id) => id !== listing.dbId)] : ids.filter((id) => id !== listing.dbId)))
      const result = await saveFavorite(listing.dbId, saved)
      if (result.ok) mutateFavorites(() => result.data)
      else {
        reloadFavorites()
        toast(result.error, 'error')
      }
    },
    [mutateFavorites, reloadFavorites, toast],
  )

  const resetDemoData = useCallback(() => setState(seedState()), [])

  const value = useMemo(() => {
    const { listings, reservations, notifications, reviews, conversations, favorites, recentlyViewed, compare, preferences, activity, contactMessages } = state
    const userId = user?.id
    // Personal notifications plus ones sent to the whole role (e.g. every admin).
    const myNotificationIds = user ? [user.id, `role:${user.role}`] : []
    const myNotifications = notifications.filter((item) => myNotificationIds.includes(item.userId))
    const myListings = USE_API ? (mineApi.data ?? []).map((listing) => ({ ...listing, ownerId: userId })) : listings.filter((item) => item.ownerId === userId)
    const myListingIds = new Set(myListings.map((item) => item.id))

    // Boarders only see listings an admin has approved.
    const publicListings = USE_API ? (publicApi.data ?? []) : listings.filter((item) => item.approval === 'Approved' && !item.removed)
    // With the API, a listing that isn't public any more reads as removed, except to its landlord.
    const listingById = (id) => (USE_API ? (publicListings.find((item) => item.id === id) ?? myListings.find((item) => item.id === id)) : listings.find((item) => item.id === id))
    const ownerOf = (listing) => {
      if (listing.landlord) return { name: listing.landlord.name, phone: listing.landlord.phone ?? '' }
      const account = findAccount(listing.ownerId)
      return account ? { name: account.name, phone: account.phone, email: account.email } : (OTHER_LANDLORDS[listing.ownerId] ?? { name: 'Landlord' })
    }

    // With the API each listing carries its rating; the demo counts its own reviews.
    const ratingTotals = {}
    for (const item of USE_API ? [] : reviews) {
      const total = (ratingTotals[item.listingId] ??= { sum: 0, count: 0 })
      total.sum += item.rating
      total.count += 1
    }
    const ratingOf = (listingId) => {
      if (USE_API) return listingById(listingId)?.rating ?? { average: 0, count: 0 }
      const total = ratingTotals[listingId]
      return total ? { average: total.sum / total.count, count: total.count } : { average: 0, count: 0 }
    }

    const myReservations = USE_API ? (requestsApi.data ?? []) : reservations.filter((item) => item.boarderId === userId)
    const incomingReservations = USE_API ? (incomingApi.data ?? []) : reservations.filter((item) => myListingIds.has(item.listingId))
    // Saved listings: MySQL ids from the API, shown for the listings that are still public.
    const appIdOf = new Map(publicListings.map((listing) => [listing.dbId, listing.id]))
    const myFavorites = USE_API ? (favoritesApi.data ?? []).map((id) => appIdOf.get(id)).filter(Boolean) : (favorites[userId] ?? [])

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
    const myCompare = (compare[compareKey] ?? []).filter((id) => publicListings.some((item) => item.id === id))

    return {
      listings,
      reservations,
      // The demo's reviews (with the API, reviews load per listing: see useListingReviews).
      reviews: USE_API ? [] : reviews,
      publicListings,
      // False while the public listings are loading from the API; error if they couldn't.
      listingsReady: publicApi.ready,
      listingsError: publicApi.error,
      reloadListings: publicApi.reload,
      activity,
      contactMessages,
      myListings,
      // False while a landlord's own listings are loading from the API.
      myListingsReady: mineApi.ready,
      myListingsError: mineApi.error,
      reloadMyListings: mineApi.reload,
      myReservations,
      myReservationsReady: requestsApi.ready,
      incomingReservations,
      incomingReservationsReady: incomingApi.ready,
      notifications: myNotifications,
      conversations: myConversations,
      favorites: myFavorites,
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
        pendingReservations: incomingReservations.filter((item) => item.status === 'Pending').length,
        messages: myConversations.reduce((sum, item) => sum + item.unread, 0),
      },
      toggleFavorite: (listingId) => {
        if (!USE_API) return toggleFavorite(userId, listingId)
        const listing = publicListings.find((item) => item.id === listingId)
        if (listing) toggleSaved(listing, !myFavorites.includes(listingId))
      },
      recordView: (listingId) => {
        recordView(compareKey, listingId)
        const listing = USE_API && publicListings.find((item) => item.id === listingId)
        if (listing) countListingView(listing.dbId)
      },
      toggleCompare: (listingId) => toggleCompare(compareKey, listingId),
      clearCompare: () => clearCompare(compareKey),
      // { listing, room, moveIn, message }. Resolves to { ok } or { ok: false, error, fields }.
      createReservation: (details) => requestReservation(user, details),
      // status: 'Cancelled', 'Approved' or 'Declined'. Resolves to { ok } or { ok: false, error }.
      setReservationStatus: (reservation, status, note) => changeReservation(user, reservation, status, note),
      // existing: the listing being edited, or null for a new one.
      saveListing: (fields, existing) => saveOwnListing(user, fields, existing),
      deleteListing: (listing) => deleteOwnListing(user, listing),
      updateRoom: updateOwnRoom,
      // For the moment right after sign-up, before the new account is the signed-in user.
      logEventAs: logEvent,
      sendContactMessage,
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
    publicApi,
    mineApi,
    incomingApi,
    requestsApi,
    favoritesApi,
    user,
    findAccount,
    toggleFavorite,
    toggleSaved,
    recordView,
    toggleCompare,
    clearCompare,
    requestReservation,
    changeReservation,
    saveOwnListing,
    deleteOwnListing,
    updateOwnRoom,
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
