import { Cloud, House, HOUSE_PALETTES, Palm, SkyGradients, Tree, useSvgId } from './parts'

// Street-front view of a single boarding house. Behaves like `object-cover` inside its box.
export default function HouseArt({ variant = 0, className = '' }) {
  const id = useSvgId('house')
  const palette = HOUSE_PALETTES[variant % HOUSE_PALETTES.length]
  const glass = `url(#${id}-glass)`

  return (
    <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <SkyGradients id={id} />
      </defs>
      <rect width="320" height="220" fill={`url(#${id}-sky)`} />
      <Cloud x={46} y={28} />
      <Cloud x={252} y={20} scale={0.8} />
      <path d="M0 170 C60 140 120 152 170 158 S270 138 320 150 V220 H0Z" fill="#a3d08c" opacity=".75" />

      {variant === 1 ? (
        <>
          <Palm x={30} y={196} h={92} />
          <Palm x={292} y={196} h={84} />
          <Tree x={266} y={196} h={70} />
        </>
      ) : (
        <>
          <Tree x={30} y={196} h={96} />
          <Tree x={62} y={196} h={66} color="#55944a" />
          <Tree x={288} y={196} h={92} />
          <Tree x={258} y={196} h={60} color="#55944a" />
        </>
      )}

      <House palette={palette} glass={glass} transform="translate(62 46)" />

      <rect y="194" width="320" height="26" fill={`url(#${id}-grass)`} />
      <polygon points="146,196 174,196 198,220 122,220" fill="#dcd6c8" />
      <rect x="26" y="184" width="118" height="14" rx="7" fill="#3f7f3b" />
      <rect x="176" y="184" width="122" height="14" rx="7" fill="#3f7f3b" />
      <circle cx="18" cy="202" r="15" fill="#4a8b3f" />
      <circle cx="304" cy="203" r="17" fill="#4a8b3f" />
    </svg>
  )
}
