export function LogoMark({ className = '', size = 20, tone = 'light' }) {
  const body = tone === 'light' ? '#ffffff' : 'var(--accent)'
  const detail = tone === 'light' ? 'var(--sidebar)' : '#ffffff'
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true">
      <rect x="27" y="6" width="4.5" height="9" fill={body} />
      <path d="M20 3.5 2.5 18.5h4.5V36h26V18.5h4.5L20 3.5Z" fill={body} />
      <rect x="10.5" y="19.5" width="5.5" height="5.5" rx="0.5" fill={detail} />
      <rect x="24" y="19.5" width="5.5" height="5.5" rx="0.5" fill={detail} />
      <path d="M16 36V28a4 4 0 0 1 8 0v8Z" fill={detail} />
    </svg>
  )
}

export default function Logo({ tagline, tone = 'light' }) {
  const textColor = tone === 'light' ? 'text-white' : 'text-body'
  const taglineColor = tone === 'light' ? 'text-white text-opacity-75' : 'text-body-secondary'
  return (
    <div className="d-flex align-items-center gap-3">
      <LogoMark className="flex-shrink-0" size={40} tone={tone} />
      <div className="lh-sm">
        <p className={`fs-5 fw-bold tracking-tight mb-0 ${textColor}`}>RoomEase</p>
        {tagline && <p className={`text-xs mb-0 ${taglineColor}`}>{tagline}</p>}
      </div>
    </div>
  )
}
