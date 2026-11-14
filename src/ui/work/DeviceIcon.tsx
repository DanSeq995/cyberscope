import type { DeviceKind } from '@/sim/network/types'

const WHITE = { stroke: '#fff', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const

/** Icona di un dispositivo, disegnata intorno all'origine (circa 52×44 unità). Grafica originale del gioco. */
export function DeviceIcon({ kind }: { kind: DeviceKind }) {
  switch (kind) {
    case 'router':
      return (
        <g>
          <circle r={21} fill="#0f766e" />
          <path {...WHITE} d="M-13 0H13M-13 0l5-4M-13 0l5 4M13 0l-5-4M13 0l-5 4M0-13V13M0-13l-4 5M0-13l4 5M0 13l-4-5M0 13l4-5" />
        </g>
      )
    case 'switch':
      return (
        <g>
          <rect x={-25} y={-14} width={50} height={28} rx={5} fill="#1d4ed8" />
          <path {...WHITE} d="M-15-5H12M12-5l-5-4M12-5l-5 4M15 5H-12M-12 5l5-4M-12 5l5 4" />
        </g>
      )
    case 'firewall':
      return (
        <g>
          <rect x={-24} y={-17} width={48} height={34} rx={3} fill="#c2410c" />
          <path stroke="#fed7aa" strokeWidth={1.6} fill="none" d="M-24-6H24M-24 6H24M-8-17V-6M10-17V-6M-16-6V6M2-6V6M18-6V6M-8 6V17M10 6V17" />
        </g>
      )
    case 'server':
      return (
        <g>
          <rect x={-15} y={-21} width={30} height={42} rx={3} fill="#475569" />
          <path stroke="#cbd5e1" strokeWidth={2} strokeLinecap="round" d="M-9-12H9M-9-4H9M-9 4H9" />
          <circle cx={8} cy={14} r={2.2} fill="#4ade80" />
        </g>
      )
    case 'pc':
      return (
        <g>
          <rect x={-20} y={-18} width={40} height={27} rx={3} fill="#334155" />
          <rect x={-16} y={-14} width={32} height={19} fill="#bae6fd" />
          <path stroke="#334155" strokeWidth={4} strokeLinecap="round" d="M0 9V16M-10 17H10" />
        </g>
      )
    case 'cloud':
      return (
        <g fill="#94a3b8">
          <circle cx={-12} cy={3} r={11} />
          <circle cx={1} cy={-5} r={14} />
          <circle cx={14} cy={4} r={10} />
          <rect x={-12} y={2} width={26} height={12} />
        </g>
      )
  }
}
