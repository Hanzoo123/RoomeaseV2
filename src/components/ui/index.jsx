import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import HouseArt from '../illustrations/HouseArt'
import RoomArt from '../illustrations/RoomArt'

export function SectionHeader({ title, actionLabel = 'View All', actionTo, action }) {
  return (
    <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
      <h2 className="h5 fw-semibold tracking-tight mb-0">{title}</h2>
      {action ??
        (actionTo && (
          <Link to={actionTo} className="small fw-medium link-underline link-underline-opacity-0 link-underline-opacity-100-hover">
            {actionLabel}
          </Link>
        ))}
    </div>
  )
}

export function StatCard({ icon: Icon, value, label, iconClassName, filled = false }) {
  return (
    <div className="card h-100">
      <div className="card-body p-4">
        <Icon size={28} className={iconClassName} fill={filled ? 'currentColor' : 'none'} aria-hidden="true" />
        <p className="fs-3 fw-bold tracking-tight mt-3 mb-0">{value}</p>
        <p className="small text-body-secondary mb-0">{label}</p>
      </div>
    </div>
  )
}

export function WelcomeBanner({ title, subtitle, art }) {
  return (
    <section className="card welcome-banner">
      <div className="welcome-art">{art}</div>
      <div className="welcome-text position-relative px-4 pb-4 pt-1 p-sm-5">
        <h1 className="h3 fw-bold tracking-tight mb-2">{title}</h1>
        <p className="text-body-secondary mb-0">{subtitle}</p>
      </div>
    </section>
  )
}

const AVAILABILITY_STYLES = {
  Available: 'text-bg-success',
  'Limited Slots': 'text-bg-warning',
  Full: 'text-bg-secondary',
}

const APPROVAL_STYLES = {
  Approved: 'text-bg-success',
  Pending: 'text-bg-warning',
  Rejected: 'text-bg-danger',
}

const RESERVATION_STYLES = {
  Pending: 'bg-warning-subtle text-warning-emphasis',
  Approved: 'bg-success-subtle text-success-emphasis',
  Declined: 'bg-danger-subtle text-danger-emphasis',
  Cancelled: 'bg-secondary-subtle text-secondary-emphasis',
}

export function Tag({ children, tone = 'availability', className = '' }) {
  const styles = tone === 'approval' ? APPROVAL_STYLES : AVAILABILITY_STYLES
  return <span className={`badge ${styles[children] ?? 'text-bg-light'} ${className}`}>{children}</span>
}

export function StatusPill({ status }) {
  return <span className={`badge rounded-pill px-3 py-2 ${RESERVATION_STYLES[status] ?? 'text-bg-light'}`}>{status}</span>
}

// Real photo when the listing has one, otherwise the matching illustration.
export function ListingImage({ listing, kind, className = '' }) {
  if (listing.photo) {
    return <img src={listing.photo} alt={listing.name} className={className} style={{ objectFit: 'cover' }} loading="lazy" />
  }
  return kind === 'room' ? (
    <RoomArt variant={listing.art.room} className={className} />
  ) : (
    <HouseArt variant={listing.art.house} className={className} />
  )
}

// Bootstrap modal markup, opened and closed by React state instead of bootstrap.js.
export function Modal({ title, onClose, children, footer }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    dialogRef.current?.focus()
    document.body.classList.add('modal-open')
    const onKeyDown = (event) => event.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        ref={dialogRef}
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header">
              <h2 id={titleId} className="modal-title fs-6 fw-semibold">
                {title}
              </h2>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  )
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="d-flex flex-column flex-sm-row align-items-sm-end justify-content-between gap-3 mb-4">
      <div>
        {back}
        <h1 className="h4 fw-bold tracking-tight mb-1">{title}</h1>
        {subtitle && <p className="small text-body-secondary mb-0">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="card">
      <div className="card-body d-flex flex-column align-items-center text-center px-4 py-5">
        <span className="icon-tile">
          <Icon size={24} aria-hidden="true" />
        </span>
        <p className="fw-semibold mt-3 mb-1">{title}</p>
        {body && (
          <p className="small text-body-secondary mb-0" style={{ maxWidth: '24rem' }}>
            {body}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  )
}

export function Notice({ tone = 'success', children }) {
  const styles = { success: 'alert-success', error: 'alert-danger', info: 'alert-primary' }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`alert ${styles[tone]} small py-2 px-3 mb-0`}>
      {children}
    </div>
  )
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="bg-white border rounded-3 p-1 overflow-x-auto">
      <ul role="tablist" aria-label={label} className="nav nav-pills flex-nowrap gap-1">
        {tabs.map((tab) => {
          const active = value === tab.value
          return (
            <li key={tab.value} className="nav-item">
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(tab.value)}
                className={`nav-link d-flex align-items-center gap-2 text-nowrap ${active ? 'active' : ''}`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`badge rounded-pill ${active ? 'bg-white bg-opacity-25' : 'text-bg-light'}`}>{tab.count}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
