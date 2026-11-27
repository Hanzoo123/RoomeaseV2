import { useEffect, useRef, useState } from 'react'
import { fetchMessages, postMessage } from '../../api/messages'
import { USE_API } from '../../config/api'
import { useData } from '../../context/DataContext'

// How often an open chat asks for new messages (WAMP has no WebSockets).
const CHAT_RECHECK_MS = 5 * 1000

// The messages of the open chat. With the API: all of them at first, then only the newer
// ones every few seconds and when the tab regains focus; the demo reads its own.
// Returns { ready, error, messages, send(text) }; send resolves to { ok } or { ok: false, error }.
export default function useChat(conversation) {
  const data = useData()
  const { noteChat } = data
  const id = conversation.id
  const [state, setState] = useState({ id: null, ready: false, error: '', messages: [] })
  const lastId = useRef(0)
  // The newest version of the conversation (the list reloads), for the API calls.
  const latest = useRef(conversation)
  useEffect(() => {
    latest.current = conversation
  })

  useEffect(() => {
    if (!USE_API) return undefined
    let active = true
    lastId.current = 0
    const load = async () => {
      const result = await fetchMessages(latest.current, lastId.current)
      if (!active) return
      if (!result.ok) {
        setState((current) => ({ ...current, id, ready: true, error: current.id === id && current.messages.length ? '' : result.error }))
        return
      }
      const newest = result.messages.at(-1)
      if (newest) {
        lastId.current = Math.max(lastId.current, newest.id)
        noteChat(id, { lastMessage: newest })
      }
      setState((current) => {
        const known = current.id === id ? current.messages : []
        const seen = new Set(known.map((message) => message.id))
        const fresh = result.messages.filter((message) => !seen.has(message.id))
        if (current.id === id && current.ready && !fresh.length) return current
        return { id, ready: true, error: '', messages: [...known, ...fresh] }
      })
    }
    load()
    const timer = setInterval(load, CHAT_RECHECK_MS)
    window.addEventListener('focus', load)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [id, noteChat])

  async function send(text) {
    if (!USE_API) {
      data.sendMessage(id, text)
      return { ok: true }
    }
    const result = await postMessage(latest.current, text)
    if (result.ok) {
      lastId.current = Math.max(lastId.current, result.message.id)
      setState((current) => (current.messages.some((message) => message.id === result.message.id) ? current : { ...current, messages: [...current.messages, result.message] }))
      noteChat(id, { lastMessage: result.message, unread: 0 })
    }
    return result
  }

  if (!USE_API) return { ready: true, error: '', messages: conversation.messages, send }
  const mine = state.id === id
  return { ready: mine && state.ready, error: mine ? state.error : '', messages: mine ? state.messages : [], send }
}
