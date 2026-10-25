import { useState } from 'react'
import { Inbox, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, timeAgo } from '../../data/mockData'
import { EmptyState, Modal, PageHeader, Tabs } from '../../components/ui'

// Messages from the public Contact page. Replies go out from the admin's own email app.
export default function ContactInbox() {
  const { contactMessages, setContactRead, deleteContactMessage } = useData()
  const toast = useToast()
  const [tab, setTab] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const unreadCount = contactMessages.filter((message) => !message.read).length
  const rows = contactMessages.filter((message) => tab === 'all' || !message.read)
  const open = contactMessages.find((message) => message.id === openId)

  function select(message) {
    setOpenId(message.id)
    if (!message.read) setContactRead(message.id, true)
  }

  return (
    <div>
      <PageHeader title="Contact Inbox" subtitle="Messages sent through the Contact Us page." />

      {contactMessages.length ? (
        <div className="row g-4">
          <div className="col-lg-5">
            <Tabs
              tabs={[
                { value: 'all', label: 'All', count: contactMessages.length },
                { value: 'unread', label: 'Unread', count: unreadCount },
              ]}
              value={tab}
              onChange={setTab}
              label="Messages"
            />
            <ul className="list-unstyled card mt-3 mb-0 overflow-hidden">
              {rows.map((message) => (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => select(message)}
                    aria-current={message.id === openId ? 'true' : undefined}
                    className={`conversation-item w-100 text-start border-0 bg-transparent px-3 py-3 ${message.id === openId ? 'active' : ''}`}
                  >
                    <span className="d-flex justify-content-between gap-2">
                      <span className={`small text-truncate ${message.read ? 'fw-medium' : 'fw-bold'}`}>
                        {!message.read && <span className="d-inline-block rounded-circle bg-primary me-2" style={{ width: 8, height: 8 }} aria-label="Unread" />}
                        {message.name}
                      </span>
                      <span className="text-2xs text-body-secondary text-nowrap">{timeAgo(message.date)}</span>
                    </span>
                    <span className="d-block text-xs text-body-secondary">{message.topic}</span>
                    <span className="d-block text-xs text-body-secondary text-truncate">{message.message}</span>
                  </button>
                </li>
              ))}
              {!rows.length && <li className="small text-body-secondary text-center p-4">No unread messages.</li>}
            </ul>
          </div>

          <div className="col-lg-7">
            {open ? (
              <article className="card">
                <div className="card-body p-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between gap-2">
                    <div>
                      <span className="badge bg-primary-subtle text-primary-emphasis mb-2">{open.topic}</span>
                      <h2 className="h5 fw-semibold mb-0">{open.name}</h2>
                      <a href={`mailto:${open.email}`} className="small text-decoration-none">
                        {open.email}
                      </a>
                    </div>
                    <p className="text-xs text-body-secondary mb-0">{formatDateTime(open.date)}</p>
                  </div>
                  <p className="border-top pt-3 mt-3 mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {open.message}
                  </p>
                  <div className="d-flex flex-wrap gap-2 border-top pt-3 mt-4">
                    <a
                      className="btn btn-primary"
                      href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.topic}`)}&body=${encodeURIComponent(`Hi ${open.name.split(' ')[0]},\n\n\n\n— The RoomEase team\n\n> ${open.message.replace(/\n/g, '\n> ')}`)}`}
                    >
                      <Reply size={16} aria-hidden="true" />
                      Reply by email
                    </a>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setContactRead(open.id, !open.read)
                        toast(open.read ? 'Marked as unread.' : 'Marked as read.', 'info')
                      }}
                    >
                      {open.read ? <Mail size={16} aria-hidden="true" /> : <MailOpen size={16} aria-hidden="true" />}
                      {open.read ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button type="button" className="btn btn-outline-danger ms-sm-auto" onClick={() => setConfirmDelete(open)}>
                      <Trash2 size={16} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ) : (
              <EmptyState icon={Mail} title="Choose a message" body="Pick a message on the left to read it." />
            )}
          </div>
        </div>
      ) : (
        <EmptyState icon={Inbox} title="No messages yet" body="When someone writes through the Contact Us page, it shows up here." />
      )}

      {confirmDelete && (
        <Modal
          title="Delete this message?"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  deleteContactMessage(confirmDelete.id)
                  setOpenId(null)
                  setConfirmDelete(null)
                  toast('Message deleted.', 'info')
                }}
              >
                Delete
              </button>
            </>
          }
        >
          <p className="small mb-0">
            The message from <strong>{confirmDelete.name}</strong> about “{confirmDelete.topic}” will be removed. This can’t be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}
