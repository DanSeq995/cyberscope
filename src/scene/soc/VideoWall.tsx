import { Html } from '@react-three/drei'

import { useGameStore } from '@/state/game'
import { DASHBOARD_WIDTH } from '@/ui/dashboardSize'
import { SocDashboard } from '@/ui/SocDashboard'

import { VIDEO_WALL } from '../office/layout'

/** drei Html transform: 1 px = 0,025 m × scale → la dashboard copre esattamente il video wall. */
const SCALE = VIDEO_WALL.size[0] / DASHBOARD_WIDTH / 0.025
const [WX, WY, WZ] = VIDEO_WALL.position
const FRONT_Z = WZ + VIDEO_WALL.size[2] / 2 + 0.01

/** Dashboard SIEM proiettata sul video wall del SOC. */
export function VideoWall() {
  // L'HTML sta sempre sopra il canvas: coprirebbe il portatile 3D in mano e il monitor durante lo zoom dei PC da scrivania.
  // visibility (non smontare): rimontare Html riattiverebbe il bug drei/React 19 StrictMode.
  // Nascosto anche per il red team: dalla sua stanza l'HTML si vedrebbe attraverso i muri.
  const hidden = useGameStore((s) => s.team !== 'blue' || s.laptop !== 'closed' || s.desk !== 'closed')
  return (
    <Html
      transform
      occlude
      position={[WX, WY, FRONT_Z]}
      scale={SCALE}
      zIndexRange={[5, 0]}
      className="pointer-events-none select-none"
    >
      <div style={{ visibility: hidden ? 'hidden' : 'visible' }}>
        <SocDashboard />
      </div>
    </Html>
  )
}
