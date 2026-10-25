import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { formatDate, timeAgo } from '../../data/mockData'
import { PageHeader } from '../../components/ui'

const timeOnly = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
}

function dayLabel(iso) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(Date.now() - 86400000)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return formatDate(iso)
}

function ConversationList({ conversations, activeId, role }) {
  return (
    <ul className="list-unstyled mb-0">
      {conversations.map((item) => {
        const last = item.messages.at(-1)
        return (
          <li key={item.id}>
            <Link to={`/${role}/messages/${item.id}`} className={`conversation-item d-flex gap-3 px-3 py-3 text-reset-link ${item.id === activeId ? 'active' : ''}`} aria-current={item.id === activeId ? 'page' : undefined}>
              <span className="avatar avatar-soft">{initials(item.otherName)}</span>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="d-flex align-items-baseline justify-content-between gap-2">
                  <span className={`small text-truncate ${item.unread ? 'fw-bold' : 'fw-semibold'}`}>{item.otherName}</span>
                  {last && <span className="text-2xs text-body-secondary flex-shrink-0">{timeAgo(last.date)}</span>}
                </div>
                <p className="text-xs text-body-secondary text-truncate mb-1">{item.listing?.name ?? 'Removed listing'}</p>
                <div className="d-flex align-items-center gap-2">
                  <p className={`text-xs text-truncate mb-0 flex-grow-1 ${item.unread ? 'text-body fw-medium' : 'text-body-secondary'}`}>{last ? last.text : 'No messages yet'}</p>
                  {item.unread > 0 && (
                    <span className="count-badge">
                      {item.unread}
                      <span className="visually-hidden"> unread</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function Thread({ conversation, role }) {
  const { user } = useAuth()
  const { sendMessage, markConversationRead } = useData()
  // A question picked on the room page ("Worth asking the landlord") arrives as a draft.
  const location = useLocation()
  const [text, setText] = useState(() => location.state?.draft ?? '')
  const scrollRef = useRef(null)
  const messageCount = conversation.messages.length

  useEffect(() => {
    markConversationRead(conversation.id)
  }, [conversation.id, messageCount, markConversationRead])

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [conversation.id, messageCount])

  function send(event) {
    event?.preventDefault()
    const message = text.trim()
    if (!message) return
    sendMessage(conversation.id, message)
    setText('')
  }

  const listingLink = conversation.listing && (role === 'boarder' ? `/boarder/rooms/${conversation.listing.id}` : `/landlord/listings/${conversation.listing.id}`)

  return (
    <div className="d-flex flex-column h-100">
      <div className="d-flex align-items-center gap-3 px-3 py-2 border-bottom">
        <Link to={`/${role}/messages`} className="btn btn-link text-body p-1 d-md-none" aria-label="Back to conversations">
          <ArrowLeft size={20} />
        </Link>
        <span className="avatar avatar-soft">{initials(conversation.otherName)}</span>
        <div style={{ minWidth: 0 }}>
          <p className="fw-semibold small mb-0">{conversation.otherName}</p>
          {listingLink ? (
            <Link to={listingLink} className="text-xs text-decoration-none text-truncate d-block">
              {conversation.listing.name}
            </Link>
          ) : (
            <span className="text-xs text-body-secondary">Removed listing</span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-grow-1 overflow-y-auto px-3 py-3 bg-page" aria-live="polite">
        {messageCount === 0 && <p className="small text-body-secondary text-center my-5">Say hello and ask anything about the room.</p>}
        {conversation.messages.map((message, index) => {
          const mine = message.senderId === user.id
          const day = dayLabel(message.date)
          const showDay = index === 0 || day !== dayLabel(conversation.messages[index - 1].date)
          return (
            <div key={message.id}>
              {showDay && (
                <p className="text-center my-3">
                  <span className="badge rounded-pill bg-body text-body-secondary border fw-normal">{day}</span>
                </p>
              )}
              <div className={`d-flex mb-2 ${mine ? 'justify-content-end' : 'justify-content-start'}`}>
                <div className={`bubble ${mine ? 'bubble-mine' : 'bubble-theirs'}`}>
                  <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </p>
                  <span className="bubble-time">{timeOnly.format(new Date(message.date))}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={send} className="d-flex align-items-end gap-2 p-2 border-top">
        <label htmlFor="message-input" className="visually-hidden">
          Message {conversation.otherName}
        </label>
        <textarea
          id="message-input"
          className="form-control"
          rows={1}
          maxLength={1000}
          placeholder="Write a message…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) send(event)
          }}
          style={{ resize: 'none', maxHeight: '8rem' }}
        />
        <button type="submit" className="btn btn-primary" disabled={!text.trim()} aria-label="Send message">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

export default function Messages({ role }) {
  const { conversationId } = useParams()
  const { conversations } = useData()
  const active = conversations.find((item) => item.id === conversationId)

  return (
    <div>
      <PageHeader title="Messages" subtitle={role === 'boarder' ? 'Chat with landlords about their rooms.' : 'Answer boarders’ questions about your listings.'} />

      <div className="card overflow-hidden messages-shell">
        {conversations.length === 0 ? (
          <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
            <span className="icon-tile">
              <MessageCircle size={24} aria-hidden="true" />
            </span>
            <p className="fw-semibold mt-3 mb-1">No messages yet</p>
            <p className="small text-body-secondary mb-3" style={{ maxWidth: '22rem' }}>
              {role === 'boarder' ? 'Open any room and tap “Message landlord” to ask a question.' : 'When a boarder messages you about a listing, it shows up here.'}
            </p>
            {role === 'boarder' && (
              <Link to="/boarder/browse" className="btn btn-primary">
                Browse rooms
              </Link>
            )}
          </div>
        ) : (
          <div className="row g-0 h-100">
            <div className={`col-md-4 border-end h-100 overflow-y-auto ${conversationId ? 'd-none d-md-block' : ''}`}>
              <ConversationList conversations={conversations} activeId={conversationId} role={role} />
            </div>
            <div className={`col-md-8 h-100 ${conversationId ? '' : 'd-none d-md-block'}`}>
              {active ? (
                <Thread key={active.id} conversation={active} role={role} />
              ) : (
                <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center text-body-secondary p-4">
                  <MessageCircle size={32} className="mb-2" aria-hidden="true" />
                  <p className="small mb-0">{conversationId ? 'This conversation no longer exists.' : 'Choose a conversation to read it.'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
