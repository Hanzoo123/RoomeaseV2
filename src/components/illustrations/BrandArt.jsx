import { Cloud, House, HOUSE_PALETTES, Tree, useSvgId } from './parts'

// Line-and-fill house scene at the bottom of the sidebar. Colors follow the active role.
export function SidebarArt({ className = '' }) {
  const line = 'rgba(255,255,255,0.55)'
  return (
    <svg viewBox="0 0 200 92" className={className} aria-hidden="true">
      <path d="M22 18 q6 -6 12 0 q6 -6 12 0" stroke={line} strokeWidth="1.2" fill="none" />
      <path d="M150 12 q5 -5 10 0 q5 -5 10 0" stroke={line} strokeWidth="1.2" fill="none" />

      <g fill="none" stroke={line} strokeWidth="1.3">
        <circle cx="30" cy="58" r="13" />
        <path d="M30 71 V84 M30 66 l-5 -5 M30 68 l5 -5" />
        <circle cx="52" cy="66" r="9" />
        <path d="M52 75 V84" />
        <circle cx="170" cy="58" r="13" />
        <path d="M170 71 V84 M170 66 l5 -5" />
        <circle cx="150" cy="68" r="8" />
        <path d="M150 76 V84" />
      </g>

      <g stroke={line} strokeWidth="1.3" strokeLinejoin="round">
        <rect x="68" y="44" width="62" height="40" fill="var(--sidebar-art)" />
        <polygon points="62,46 99,18 136,46" fill="var(--sidebar-art)" />
        <rect x="122" y="22" width="7" height="14" fill="var(--sidebar-art)" />
        <rect x="88" y="62" width="14" height="22" fill="var(--sidebar-deep)" />
      </g>
      <g fill="rgba(255,255,255,0.75)">
        <rect x="74" y="52" width="9" height="9" />
        <rect x="115" y="52" width="9" height="9" />
        <rect x="74" y="68" width="9" height="9" />
        <rect x="115" y="68" width="9" height="9" />
        <circle cx="99" cy="34" r="4" />
      </g>
      <path d="M8 84 H192" stroke={line} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

const brandBlue = HOUSE_PALETTES[3]

// House-in-a-circle illustration for the boarder "Need a place to stay?" banner.
export function CtaHouseArt({ className = '', width }) {
  const id = useSvgId('cta')
  return (
    <svg viewBox="0 0 200 150" width={width} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dbe8ff" />
          <stop offset="1" stopColor="#7fa6f0" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="78" r="66" fill="#d7e4ff" />
      <Cloud x={52} y={30} scale={0.7} />
      <Cloud x={150} y={44} scale={0.55} />
      <ellipse cx="100" cy="140" rx="90" ry="8" fill="#bcd0f7" />
      <Tree x={30} y={140} h={74} color="#3a72e6" dark="#1d5bd8" light="#7ea4f2" trunk="#1546ab" />
      <Tree x={172} y={140} h={66} color="#3a72e6" dark="#1d5bd8" light="#7ea4f2" trunk="#1546ab" />
      <House palette={brandBlue} glass={`url(#${id}-glass)`} transform="translate(44 52) scale(.56)" />
    </svg>
  )
}
