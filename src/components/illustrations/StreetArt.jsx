import { Cloud, House, HOUSE_PALETTES, Palm, SkyGradients, Tree, useSvgId } from './parts'

function MidRise({ x, y, glass }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="96" height="118" fill="#e9e4da" />
      <rect width="96" height="8" fill="#9a9184" />
      {Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 4 }, (_, col) => (
          <rect key={`${row}-${col}`} x={10 + col * 21} y={18 + row * 23} width="13" height="15" fill={glass} stroke="#fff" strokeWidth="1.5" />
        )),
      )}
      <rect x="36" y="96" width="24" height="22" fill="#6f4a2d" />
      <rect x="28" y="92" width="40" height="4" fill="#9a9184" />
    </g>
  )
}

// Neighbourhood scenes for the "Popular Locations" cards.
export default function StreetArt({ variant = 0, className = '' }) {
  const id = useSvgId('street')
  const glass = `url(#${id}-glass)`
  const [cream, terracotta, slate] = HOUSE_PALETTES

  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <SkyGradients id={id} />
      </defs>
      <rect width="320" height="200" fill={`url(#${id}-sky)`} />
      <Cloud x={60} y={26} />
      <Cloud x={250} y={36} scale={0.7} />

      {variant === 0 && (
        <>
          <Tree x={14} y={170} h={90} />
          <House palette={cream} glass={glass} transform="translate(26 76) scale(.62)" />
          <Tree x={162} y={170} h={74} color="#55944a" />
          <House palette={slate} glass={glass} transform="translate(178 68) scale(.68)" />
          <Tree x={312} y={170} h={84} />
        </>
      )}

      {variant === 1 && (
        <>
          <path d="M0 150 C80 120 180 140 320 118 V200 H0Z" fill="#a3d08c" />
          <Palm x={32} y={172} h={96} />
          <House palette={terracotta} glass={glass} transform="translate(72 60) scale(.74)" />
          <Palm x={250} y={172} h={86} />
          <Tree x={296} y={172} h={80} />
        </>
      )}

      {variant === 2 && (
        <>
          <Tree x={20} y={170} h={70} />
          <House palette={cream} glass={glass} transform="translate(30 92) scale(.52)" />
          <MidRise x={142} y={52} glass={glass} />
          <Tree x={258} y={170} h={64} color="#55944a" />
          <House palette={terracotta} glass={glass} transform="translate(250 104) scale(.44)" />
        </>
      )}

      {variant === 3 && (
        <>
          <path d="M0 96 C70 70 150 90 210 74 S290 60 320 70 V200 H0Z" fill="#6aa857" />
          <path d="M0 128 C90 110 190 130 320 108 V200 H0Z" fill="#83bd68" />
          {[18, 52, 88, 250, 286, 312].map((tx, i) => (
            <Tree key={tx} x={tx} y={i % 2 ? 118 : 112} h={46} color="#3f7d38" dark="#2f6229" />
          ))}
          <House palette={terracotta} glass={glass} transform="translate(104 92) scale(.5)" />
          <House palette={terracotta} glass={glass} transform="translate(198 104) scale(.4)" />
          <Tree x={60} y={172} h={70} />
          <Palm x={290} y={172} h={70} />
        </>
      )}

      <rect y="168" width="320" height="32" fill={`url(#${id}-grass)`} />
      <rect y="182" width="320" height="18" fill="#8e9298" />
      <rect y="180" width="320" height="3" fill="#d9d6ce" />
      {[20, 80, 140, 200, 260].map((dx) => (
        <rect key={dx} x={dx} y="190" width="28" height="2.5" fill="#f2efe6" />
      ))}
    </svg>
  )
}
