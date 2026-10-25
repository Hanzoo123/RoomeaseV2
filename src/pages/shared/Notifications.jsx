import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck } from 'lucide-react'
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
    <div className="content-narrow">
      <PageHeader
        title="Notifications"
        subtitle={counts.notifications ? `You have ${counts.notifications} unread ${counts.notifications === 1 ? 'notification' : 'notifications'}.` : 'You’re all caught up.'}
        actions={
          counts.notifications > 0 && (
            <button type="button" onClick={markAllRead} className="btn btn-outline-secondary">
              <CheckCheck size={16} aria-hidden="true" />
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

      <div className="mt-4">
        {visible.length === 0 ? (
          <EmptyState icon={BellOff} title={tab === 'Unread' ? 'No unread notifications' : 'No notifications yet'} body="Updates about your listings and reservations will appear here." />
        ) : (
          <ul className="list-group shadow-sm rounded-4">
            {visible.map((item) => (
              <li key={item.id} className={`list-group-item d-flex align-items-start gap-3 px-3 px-sm-4 py-3 ${item.read ? '' : 'bg-primary-subtle bg-opacity-50'}`}>
                <span
                  className={`rounded-circle flex-shrink-0 mt-2 ${item.read ? '' : 'bg-primary'}`}
                  style={{ width: '0.625rem', height: '0.625rem' }}
                  aria-hidden="true"
                />
                <button type="button" onClick={() => open(item)} className="btn btn-link d-block text-start text-decoration-none text-body p-0 flex-grow-1" style={{ minWidth: 0 }}>
                  <span className={`d-block small ${item.read ? 'fw-medium' : 'fw-semibold'}`}>
                    {item.title}
                    {!item.read && <span className="visually-hidden"> (unread)</span>}
                  </span>
                  <span className="d-block small text-body-secondary">{item.body}</span>
                  <span className="d-block text-xs text-body-secondary mt-1">{formatDateTime(item.date)}</span>
                </button>
                <button type="button" onClick={() => deleteNotification(item.id)} aria-label={`Dismiss “${item.title}”`} className="btn-close flex-shrink-0" style={{ fontSize: '0.625rem' }} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
