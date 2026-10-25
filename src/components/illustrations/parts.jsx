import { useId } from 'react'

// Shared SVG building blocks for the listing, location and room illustrations.

export function useSvgId(prefix) {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}

export const HOUSE_PALETTES = [
  { roof: '#3e6a50', roofDark: '#2c4e3a', wall: '#f3e8d0', trim: '#ffffff', door: '#7b4c2c', base: '#b9a98c' },
  { roof: '#a2563a', roofDark: '#7c3f29', wall: '#efede7', trim: '#ffffff', door: '#6f4428', base: '#b4ada0' },
  { roof: '#46566c', roofDark: '#323f51', wall: '#ece0c4', trim: '#ffffff', door: '#5d3d26', base: '#b3a383' },
  { roof: '#1d5bd8', roofDark: '#1546ab', wall: '#ffffff', trim: '#eaf1ff', door: '#1d5bd8', base: '#c9d6f2' },
]

export function SkyGradients({ id }) {
  return (
    <>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#97cbf0" />
        <stop offset="1" stopColor="#e8f6fd" />
      </linearGradient>
      <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d4e9f6" />
        <stop offset="1" stopColor="#6d9cc2" />
      </linearGradient>
      <linearGradient id={`${id}-grass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#89c264" />
        <stop offset="1" stopColor="#5e9944" />
      </linearGradient>
    </>
  )
}

export function Cloud({ x, y, scale = 1, opacity = 0.92 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#fff" opacity={opacity}>
      <ellipse cx="0" cy="8" rx="24" ry="8" />
      <ellipse cx="10" cy="2" rx="13" ry="10" />
      <ellipse cx="-9" cy="4" rx="10" ry="7" />
    </g>
  )
}

export function Tree({ x, y, h = 60, color = '#4c8a43', dark = '#3a7034', light = '#62a052', trunk = '#6b4a2f' }) {
  return (
    <g>
      <rect x={x - h * 0.04} y={y - h * 0.4} width={h * 0.08} height={h * 0.4} fill={trunk} />
      <circle cx={x - h * 0.17} cy={y - h * 0.46} r={h * 0.22} fill={dark} />
      <circle cx={x + h * 0.18} cy={y - h * 0.48} r={h * 0.23} fill={color} />
      <circle cx={x} cy={y - h * 0.68} r={h * 0.29} fill={color} />
      <circle cx={x - h * 0.07} cy={y - h * 0.76} r={h * 0.13} fill={light} opacity=".8" />
    </g>
  )
}

export function Palm({ x, y, h = 70, color = '#3f8a3e', trunk = '#8a6a45' }) {
  const topX = x + h * 0.08
  const topY = y - h
  const angles = [-165, -125, -85, -50, -15, 20]
  return (
    <g>
      <path d={`M${x} ${y} Q${x + h * 0.12} ${y - h * 0.5} ${topX} ${topY}`} stroke={trunk} strokeWidth={h * 0.06} fill="none" strokeLinecap="round" />
      {angles.map((angle) => {
        const rad = (angle * Math.PI) / 180
        const len = h * 0.36
        const midX = topX + Math.cos(rad) * len * 0.55
        const midY = topY + Math.sin(rad) * len * 0.55 - h * 0.08
        const endX = topX + Math.cos(rad) * len
        const endY = topY + Math.sin(rad) * len + h * 0.08
        return (
          <path
            key={angle}
            d={`M${topX} ${topY} Q${midX} ${midY} ${endX} ${endY}`}
            stroke={color}
            strokeWidth={h * 0.065}
            fill="none"
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}

function Window({ x, y, w, h, glass, trim }) {
  return (
    <g>
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx="1" fill={trim} />
      <rect x={x} y={y} width={w} height={h} fill={glass} />
      <path d={`M${x + w / 2} ${y}V${y + h}M${x} ${y + h * 0.42}H${x + w}`} stroke={trim} strokeWidth="1.6" />
      <rect x={x - 3} y={y + h + 1} width={w + 6} height="2.5" fill={trim} />
    </g>
  )
}

// A two-storey boarding house drawn in a 200 x 150 box with the ground at y = 150.
export function House({ palette, glass, transform }) {
  const p = palette
  return (
    <g transform={transform}>
      <polygon points="-8,50 208,50 180,16 20,16" fill={p.roof} />
      <rect x="-8" y="50" width="216" height="4" fill={p.roofDark} />

      <rect x="4" y="54" width="192" height="40" fill={p.wall} />
      <rect x="4" y="54" width="192" height="4" fill="#000" opacity=".08" />
      <polygon points="62,52 100,8 138,52" fill={p.roof} />
      <polygon points="72,52 100,21 128,52" fill={p.wall} />
      <circle cx="100" cy="38" r="5" fill={glass} stroke={p.trim} strokeWidth="1.6" />
      <rect x="72" y="54" width="56" height="40" fill={p.wall} />
      <rect x="72" y="54" width="2" height="40" fill="#000" opacity=".06" />
      <rect x="126" y="54" width="2" height="40" fill="#000" opacity=".06" />

      {[14, 42, 140, 168].map((wx) => (
        <Window key={wx} x={wx} y={62} w={18} h={24} glass={glass} trim={p.trim} />
      ))}
      <rect x="86" y="58" width="28" height="36" fill={p.trim} />
      <rect x="89" y="61" width="22" height="33" fill={glass} />
      <rect x="99.2" y="61" width="1.6" height="33" fill={p.trim} />

      <polygon points="-6,102 206,102 197,92 3,92" fill={p.roof} />
      <rect x="-6" y="102" width="212" height="3" fill={p.roofDark} />

      <rect x="78" y="78" width="44" height="2" fill={p.trim} />
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={79 + i * 4} y="80" width="1.2" height="12" fill={p.trim} />
      ))}
      <rect x="76" y="91" width="48" height="3" fill={p.trim} />

      <rect x="6" y="105" width="188" height="45" fill={p.wall} />
      <rect x="6" y="105" width="188" height="4" fill="#000" opacity=".08" />
      {[16, 46, 132, 162].map((wx) => (
        <Window key={wx} x={wx} y={114} w={22} h={22} glass={glass} trim={p.trim} />
      ))}

      <polygon points="83,110 117,110 112,104 88,104" fill={p.roof} />
      <rect x="87" y="110" width="26" height="40" fill={p.trim} />
      <rect x="90" y="113" width="20" height="37" fill={p.door} />
      <rect x="93" y="117" width="14" height="12" fill="#000" opacity=".14" />
      <rect x="93" y="133" width="14" height="13" fill="#000" opacity=".14" />
      <circle cx="106" cy="132" r="1.3" fill="#f2d28b" />

      <rect x="4" y="145" width="192" height="5" fill={p.base} />
      <rect x="82" y="148" width="36" height="3" fill={p.base} />
    </g>
  )
}
