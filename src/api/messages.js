import { api } from './client'
import { appListingId, appUserId } from './ids'

// Chats, notifications and the Contact form (/conversations, /notifications, /contact).

// A message in the app's shape: { id, senderId (app user id), text, date }.
function toAppMessage(message, conversation) {
  const sender = message.senderId === conversation.boarder.id ? conversation.boarder : message.senderId === conversation.landlord.id ? conversation.landlord : null
  return { id: message.id, senderId: sender ? appUserId(sender) : null, text: message.body, date: message.date }
}

// A conversation in the shape the Messages page uses (see CONVERSATIONS in data/mockData.js),
// with its last message instead of all of them; an open chat loads those (fetchMessages).
export function toAppConversation(conversation) {
  return {
    id: conversation.id,
    listingId: appListingId(conversation.listing),
    listingDbId: conversation.listing.id,
    listingName: conversation.listing.name,
    boarderId: appUserId(conversation.boarder),
    boarderName: conversation.boarder.name,
    landlordId: appUserId(conversation.landlord),
    landlordName: conversation.landlord.name,
    lastMessage: conversation.lastMessage && toAppMessage(conversation.lastMessage, conversation),
    unread: conversation.unread,
    // Kept to turn the open chat's messages into the app's shape.
    people: { boarder: conversation.boarder, landlord: conversation.landlord },
  }
}

export async function fetchConversations() {
  const response = await api('/conversations')
  return response.ok ? { ok: true, data: response.data.conversations.map(toAppConversation) } : response
}

// A boarder: { listingDbId }. A landlord: { listingDbId, boarderDbId } (someone who asked for a room).
export async function openConversation({ listingDbId, boarderDbId }) {
  const response = await api('/conversations', { method: 'POST', body: { listingId: listingDbId, ...(boarderDbId && { boarderId: boarderDbId }) } })
  return response.ok ? { ok: true, conversation: toAppConversation(response.data.conversation) } : response
}

// Messages oldest first; with `after` (a message id), only newer ones.
export async function fetchMessages(conversation, after = 0) {
  const response = await api(`/conversations/${conversation.id}/messages${after ? `?after=${after}` : ''}`)
  return response.ok ? { ok: true, messages: response.data.messages.map((message) => toAppMessage(message, conversation.people)) } : response
}

export async function postMessage(conversation, text) {
  const response = await api(`/conversations/${conversation.id}/messages`, { method: 'POST', body: { body: text } })
  return response.ok ? { ok: true, message: toAppMessage(response.data.message, conversation.people) } : response
}

export const markConversationSeen = (conversation) => api(`/conversations/${conversation.id}/read`, { method: 'POST' })

// { notifications: [{ id, title, body, link, read, date }], unread }
const notifications = (response) => (response.ok ? { ok: true, data: response.data } : response)
export const fetchNotifications = async () => notifications(await api('/notifications'))
export const readNotification = async (id) => notifications(await api(`/notifications/${id}/read`, { method: 'POST' }))
export const readAllNotifications = async () => notifications(await api('/notifications/read-all', { method: 'POST' }))
export const dismissNotification = async (id) => notifications(await api(`/notifications/${id}`, { method: 'DELETE' }))

// { name, email, topic, message, website } (website: the hidden field bots fill in).
export const sendContact = (fields) => api('/contact', { method: 'POST', body: fields })
