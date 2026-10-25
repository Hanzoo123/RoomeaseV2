import { Link } from 'react-router-dom'
import { timeAgo } from '../../data/mockData'
import { activityInfo, activityLink } from './activityLabels'

// One line of the activity log: who did what, to which listing or account, and when.
export default function ActivityItem({ entry }) {
  const { icon: Icon, text, tone } = activityInfo(entry.action)
  const link = activityLink(entry)
  return (
    <li className="d-flex gap-3 py-3 border-bottom">
      <span className={`icon-circle bg-${tone}-subtle text-${tone}-emphasis flex-shrink-0`} style={{ width: '2.25rem', height: '2.25rem' }}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <p className="small mb-0">
          <strong>{entry.actorName}</strong> {text}:{' '}
          {link ? (
            <Link to={link} className="fw-medium text-decoration-none">
              {entry.targetLabel}
            </Link>
          ) : (
            <span className="fw-medium">{entry.targetLabel}</span>
          )}
        </p>
        {entry.detail && <p className="text-xs text-body-secondary mb-0">“{entry.detail}”</p>}
        <p className="text-2xs text-body-secondary mb-0 mt-1">
          <time dateTime={entry.date}>{timeAgo(entry.date)}</time>
        </p>
      </div>
    </li>
  )
}
