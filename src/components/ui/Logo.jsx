export function LogoMark({ className = '', tone = 'light' }) {
  const body = tone === 'light' ? '#ffffff' : 'var(--accent)'
  const detail = tone === 'light' ? 'var(--sidebar)' : '#ffffff'
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="27" y="6" width="4.5" height="9" fill={body} />
      <path d="M20 3.5 2.5 18.5h4.5V36h26V18.5h4.5L20 3.5Z" fill={body} />
      <rect x="10.5" y="19.5" width="5.5" height="5.5" rx="0.5" fill={detail} />
      <rect x="24" y="19.5" width="5.5" height="5.5" rx="0.5" fill={detail} />
      <path d="M16 36V28a4 4 0 0 1 8 0v8Z" fill={detail} />
    </svg>
  )
}

export default function Logo({ tagline, tone = 'light' }) {
  const textColor = tone === 'light' ? 'text-white' : 'text-ink'
  const taglineColor = tone === 'light' ? 'text-white/75' : 'text-muted'
  return (
    <div className="flex items-center gap-3">
      <LogoMark className="size-10 shrink-0" tone={tone} />
      <div className="leading-tight">
        <p className={`text-xl font-bold tracking-tight ${textColor}`}>RoomEase</p>
        {tagline && <p className={`text-xs ${taglineColor}`}>{tagline}</p>}
      </div>
    </div>
  )
}
