import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck, X } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatDateTime } from '../../data/mockData'
import { EmptyState, PageHeader, Tabs } from '../../components/ui'

export default function Notifications() {
  const navigate = useNavigate()
  const { notifications, counts, markNotificationRead, markAllRead, deleteNotification } = useData()
  const [tab, setTab] = useState('All')

  const sorted = [...notifications].sort((a, b) => b.date.localeCompare(a.date))
  const visible = tab === 'Unread' ? sorted.filter((item) => !item.read) : sorted

  function open(item) {
    markNotificationRead(item.id)
    if (item.link) navigate(item.link)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle={counts.notifications ? `You have ${counts.notifications} unread ${counts.notifications === 1 ? 'notification' : 'notifications'}.` : 'You’re all caught up.'}
        actions={
          counts.notifications > 0 && (
            <button type="button" onClick={markAllRead} className="btn border border-line bg-white hover:bg-page">
              <CheckCheck className="size-4" aria-hidden="true" />
              Mark all as read
            </button>
          )
        }
      />

      <Tabs
        tabs={[
          { value: 'All', label: 'All', count: notifications.length },
          { value: 'Unread', label: 'Unread', count: counts.notifications },
        ]}
        value={tab}
        onChange={setTab}
        label="Filter notifications"
      />

      <div className="mt-5">
        {visible.length === 0 ? (
          <EmptyState icon={BellOff} title={tab === 'Unread' ? 'No unread notifications' : 'No notifications yet'} body="Updates about your listings and reservations will appear here." />
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            {visible.map((item) => (
              <li key={item.id} className={`group flex items-start gap-3 px-4 py-4 sm:px-5 ${item.read ? '' : 'bg-accent-soft/50'}`}>
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-accent'}`} aria-hidden="true" />
                <button type="button" onClick={() => open(item)} className="min-w-0 flex-1 text-left">
                  <p className={`text-sm ${item.read ? 'font-medium' : 'font-semibold'}`}>
                    {item.title}
                    {!item.read && <span className="sr-only"> (unread)</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{item.body}</p>
                  <p className="mt-1.5 text-xs text-muted">{formatDateTime(item.date)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => deleteNotification(item.id)}
                  aria-label={`Dismiss “${item.title}”`}
                  className="rounded-md p-1 text-muted opacity-60 hover:bg-page hover:text-ink group-hover:opacity-100"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
