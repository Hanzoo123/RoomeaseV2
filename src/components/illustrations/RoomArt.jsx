import { useSvgId } from './parts'

const WALLS = { single: '#f2ece3', bunk: '#e8edf2', desk: '#f1ede6' }

function RoomWindow({ id }) {
  return (
    <g>
      <rect x="14" y="32" width="84" height="100" rx="2" fill="#fff" />
      <rect x="20" y="38" width="72" height="88" fill={`url(#${id}-view)`} />
      <g clipPath={`url(#${id}-glass)`}>
        <path d="M20 104 C40 90 60 96 92 86 V126 H20Z" fill="#7fb866" />
        <path d="M20 114 C46 106 70 112 92 104 V126 H20Z" fill="#5e9944" />
        <circle cx="34" cy="98" r="8" fill="#4c8a43" />
        <circle cx="80" cy="92" r="6" fill="#4c8a43" />
      </g>
      <rect x="54.5" y="38" width="3" height="88" fill="#fff" />
      <rect x="20" y="80" width="72" height="3" fill="#fff" />
      <rect x="10" y="130" width="92" height="5" fill="#fff" />
      <rect x="2" y="24" width="108" height="3" rx="1.5" fill="#8b7a66" />
      <path d="M4 27 H22 C20 60 26 100 20 146 H2 C6 100 2 60 4 27Z" fill="#e9dcc6" />
      <path d="M90 27 H108 C106 60 112 100 108 146 H92 C96 100 90 60 90 27Z" fill="#e9dcc6" />
    </g>
  )
}

function SingleBed({ x = 0, blanket, blanketDark, headboard = '#a0714a' }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="150" y="104" width="150" height="58" rx="6" fill={headboard} />
      <rect x="158" y="112" width="134" height="40" rx="4" fill="#fff" opacity=".14" />
      <polygon points="150,150 300,150 312,176 138,176" fill="#fbfaf7" />
      <rect x="160" y="134" width="56" height="20" rx="9" fill="#fff" stroke="#e4dfd6" />
      <rect x="230" y="134" width="56" height="20" rx="9" fill="#fff" stroke="#e4dfd6" />
      <polygon points="146,158 304,158 312,176 138,176" fill={blanket} />
      <polygon points="148,155 302,155 304,161 146,161" fill="#fff" opacity=".7" />
      <rect x="138" y="176" width="174" height="12" fill={blanketDark} />
      <rect x="136" y="188" width="178" height="7" rx="2" fill="#8e6240" />
      <rect x="141" y="195" width="5" height="8" fill="#7a5235" />
      <rect x="304" y="195" width="5" height="8" fill="#7a5235" />
    </g>
  )
}

function Floor() {
  return (
    <g>
      <rect y="166" width="320" height="54" fill="#c4935f" />
      <rect y="163" width="320" height="5" fill="#e3d8c8" />
      {[180, 195, 210].map((ly) => (
        <rect key={ly} y={ly} width="320" height="1" fill="#9f6f42" opacity=".45" />
      ))}
      {[40, 110, 190, 260, 75, 150, 230, 300].map((lx, i) => (
        <rect key={lx} x={lx} y={i < 4 ? 168 : 181} width="1" height="13" fill="#9f6f42" opacity=".4" />
      ))}
    </g>
  )
}

// Interior views used for the room cards. `variant`: single | bunk | desk.
export default function RoomArt({ variant = 'single', className = '' }) {
  const id = useSvgId('room')

  return (
    <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-view`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd0f2" />
          <stop offset="1" stopColor="#e6f4fc" />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx="0.18" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-glass`}>
          <rect x="20" y="38" width="72" height="88" />
        </clipPath>
      </defs>

      <rect width="320" height="220" fill={WALLS[variant] ?? WALLS.single} />
      <Floor />
      <RoomWindow id={id} />

      {variant === 'single' && (
        <>
          <rect x="190" y="48" width="64" height="42" fill="#fff" stroke="#d8cbb8" strokeWidth="2" />
          <rect x="195" y="53" width="54" height="32" fill="#cfe3ee" />
          <path d="M195 85 L212 66 L224 76 L234 64 L249 85Z" fill="#7fae8c" />
          <ellipse cx="200" cy="210" rx="90" ry="7" fill="#e8d9c1" opacity=".8" />
          <circle cx="125" cy="122" r="22" fill="#fff6d8" opacity=".55" />
          <rect x="108" y="150" width="32" height="40" rx="2" fill="#b07c50" />
          <rect x="106" y="147" width="36" height="5" rx="1" fill="#946540" />
          <rect x="112" y="168" width="24" height="1.5" fill="#7d5536" />
          <circle cx="124" cy="160" r="1.4" fill="#f2d28b" />
          <rect x="123" y="128" width="2" height="19" fill="#8b7a66" />
          <polygon points="113,130 135,130 131,115 117,115" fill="#f6e7c8" />
          <SingleBed blanket="#9db5d4" blanketDark="#7f9cc2" />
        </>
      )}

      {variant === 'bunk' && (
        <>
          <rect x="114" y="96" width="34" height="92" rx="2" fill="#8fa3b8" />
          <rect x="130.5" y="96" width="1" height="92" fill="#6f8399" />
          {[104, 108, 112].map((vy) => (
            <g key={vy}>
              <rect x="118" y={vy} width="9" height="1.5" fill="#6f8399" />
              <rect x="135" y={vy} width="9" height="1.5" fill="#6f8399" />
            </g>
          ))}
          <rect x="126" y="140" width="2" height="10" fill="#4e5f72" />
          <rect x="134" y="140" width="2" height="10" fill="#4e5f72" />

          <rect x="165" y="106" width="131" height="54" fill="#000" opacity=".06" />
          <rect x="160" y="56" width="5" height="146" fill="#39424e" />
          <rect x="296" y="56" width="5" height="146" fill="#39424e" />
          <rect x="160" y="78" width="141" height="3" fill="#39424e" />
          <rect x="165" y="92" width="131" height="12" fill="#fff" />
          <rect x="168" y="83" width="30" height="10" rx="4" fill="#fff" stroke="#dfe3e8" />
          <rect x="202" y="89" width="94" height="15" rx="3" fill="#5b7fb8" />
          <rect x="160" y="104" width="141" height="4" fill="#39424e" />

          <rect x="165" y="160" width="131" height="14" fill="#fff" />
          <rect x="168" y="149" width="30" height="12" rx="5" fill="#fff" stroke="#dfe3e8" />
          <rect x="200" y="157" width="96" height="17" rx="3" fill="#c46a5a" />
          <rect x="160" y="174" width="141" height="5" fill="#39424e" />

          <rect x="270" y="80" width="3" height="94" fill="#4b5563" />
          <rect x="284" y="80" width="3" height="94" fill="#4b5563" />
          {[96, 112, 128, 144, 160].map((ry) => (
            <rect key={ry} x="270" y={ry} width="17" height="2.5" fill="#4b5563" />
          ))}
          <ellipse cx="228" cy="208" rx="80" ry="6" fill="#000" opacity=".08" />
        </>
      )}

      {variant === 'desk' && (
        <>
          <rect x="202" y="70" width="84" height="4" fill="#a77850" />
          <rect x="210" y="56" width="8" height="14" fill="#d4664f" />
          <rect x="219" y="58" width="7" height="12" fill="#3f6fb5" />
          <rect x="227" y="54" width="6" height="16" fill="#e2b04a" />
          <rect x="266" y="60" width="12" height="10" rx="2" fill="#c9875a" />
          <circle cx="268" cy="56" r="5" fill="#5e9944" />
          <circle cx="276" cy="54" r="5" fill="#4c8a43" />

          <rect x="8" y="140" width="112" height="6" fill="#a77850" />
          <rect x="12" y="146" width="5" height="44" fill="#946540" />
          <rect x="84" y="146" width="34" height="28" fill="#b5855b" />
          <rect x="84" y="159" width="34" height="1.5" fill="#946540" />
          <rect x="114" y="174" width="4" height="16" fill="#946540" />
          <rect x="40" y="117" width="36" height="23" rx="2" fill="#2f3a4a" />
          <rect x="43" y="120" width="30" height="17" fill="#6c8db3" />
          <polygon points="34,140 82,140 86,143 30,143" fill="#cfd5dd" />
          <rect x="14" y="132" width="20" height="4" fill="#d4664f" />
          <rect x="16" y="128" width="17" height="4" fill="#3f6fb5" />
          <rect x="15" y="136" width="19" height="4" fill="#e2b04a" />
          <path d="M102 140 L106 120 L94 110" stroke="#39424e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <polygon points="86,108 100,104 98,116" fill="#39424e" />

          <rect x="46" y="150" width="30" height="24" rx="4" fill="#3d4b5f" />
          <rect x="42" y="172" width="38" height="6" rx="2" fill="#4b5b71" />
          <rect x="46" y="178" width="3" height="16" fill="#2f3a4a" />
          <rect x="73" y="178" width="3" height="16" fill="#2f3a4a" />

          <g transform="translate(176 8) scale(.84)">
            <SingleBed blanket="#9ec2ad" blanketDark="#83ab95" headboard="#8c6a4f" />
          </g>
        </>
      )}

      <rect width="320" height="220" fill={`url(#${id}-light)`} />
    </svg>
  )
}
