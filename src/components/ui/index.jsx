import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import HouseArt from '../illustrations/HouseArt'
import RoomArt from '../illustrations/RoomArt'

export function SectionHeader({ title, actionLabel = 'View All', actionTo, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {action ??
        (actionTo && (
          <Link to={actionTo} className="text-sm font-medium text-accent hover:underline">
            {actionLabel}
          </Link>
        ))}
    </div>
  )
}

export function StatCard({ icon: Icon, value, label, iconClassName }) {
  return (
    <div className="card p-5">
      <Icon className={`size-7 ${iconClassName}`} strokeWidth={2} aria-hidden="true" />
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-muted">{label}</p>
    </div>
  )
}

export function WelcomeBanner({ title, subtitle, art }) {
  return (
    <section className="card relative overflow-hidden bg-gradient-to-r from-accent-soft via-white to-white sm:flex sm:min-h-[210px] sm:items-center">
      <div className="h-36 [mask-image:linear-gradient(to_bottom,black_55%,transparent)] sm:absolute sm:inset-y-0 sm:right-0 sm:aspect-[2/1] sm:h-auto sm:max-w-[58%] sm:[mask-image:linear-gradient(to_right,transparent,black_35%)]">
        {art}
      </div>
      <div className="relative z-10 px-6 pt-1 pb-6 sm:max-w-[55%] sm:px-8 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">{subtitle}</p>
      </div>
    </section>
  )
}

const AVAILABILITY_STYLES = {
  Available: 'bg-green-500 text-white',
  'Limited Slots': 'bg-amber-500 text-white',
  Full: 'bg-slate-500 text-white',
}

const APPROVAL_STYLES = {
  Approved: 'bg-green-500 text-white',
  Pending: 'bg-amber-500 text-white',
  Rejected: 'bg-red-500 text-white',
}

const RESERVATION_STYLES = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Declined: 'bg-red-100 text-red-700',
  Cancelled: 'bg-slate-100 text-slate-600',
}

export function Tag({ children, tone = 'availability', className = '' }) {
  const styles = tone === 'approval' ? APPROVAL_STYLES : AVAILABILITY_STYLES
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${styles[children] ?? 'bg-slate-200'} ${className}`}>
      {children}
    </span>
  )
}

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${RESERVATION_STYLES[status] ?? 'bg-slate-100'}`}>
      {status}
    </span>
  )
}

// Real photo when the listing has one, otherwise the matching illustration.
export function ListingImage({ listing, kind, className = '' }) {
  if (listing.photo) {
    return <img src={listing.photo} alt={listing.name} className={`object-cover ${className}`} loading="lazy" />
  }
  return kind === 'room' ? (
    <RoomArt variant={listing.art.room} className={className} />
  ) : (
    <HouseArt variant={listing.art.house} className={className} />
  )
}

export function Modal({ title, onClose, children, footer }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    dialogRef.current?.focus()
    const onKeyDown = (event) => event.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-page hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Notice({ tone = 'success', children }) {
  const styles = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-accent/20 bg-accent-soft text-ink',
  }
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3.5 py-2.5 text-sm ${styles[tone]}`}>
      {children}
    </p>
  )
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            value === tab.value ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`rounded-full px-1.5 text-xs ${value === tab.value ? 'bg-white/20' : 'bg-page'}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
