import { Html } from '@react-three/drei'
import { DoubleSide } from 'three'

import { useGameStore } from '@/state/game'
import { DASHBOARD_WIDTH } from '@/ui/dashboardSize'
import { SocDashboard } from '@/ui/SocDashboard'

import { VIDEO_WALL } from '../office/layout'

/** drei Html transform: 1 px = 0,025 m × scale → la dashboard copre esattamente il video wall. */
const SCALE = VIDEO_WALL.size[0] / DASHBOARD_WIDTH / 0.025
const [WX, WY, WZ] = VIDEO_WALL.position
const FRONT_Z = WZ + VIDEO_WALL.size[2] / 2 + 0.01

/** Stesso shader del piano di occlusione di drei: scrive alpha 0 e "buca" il canvas sopra l'HTML. */
const HOLE_FRAGMENT = /* glsl */ `
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
`

/** Dashboard SIEM proiettata sul video wall del SOC. */
export function VideoWall() {
  // Nascosto solo per il red team (la dashboard è del blue team).
  // Portatile 3D e monitor dei PC da scrivania la coprono da soli grazie al blending: nasconderla
  // durante le animazioni mostrerebbe la base scura del video wall.
  // visibility (non smontare): rimontare Html riattiverebbe il bug drei/React 19 StrictMode.
  const hidden = useGameStore((s) => s.team !== 'blue')
  // occlude="blending": l'HTML sta dietro il canvas e un piano trasparente con depth test lo rivela pixel per pixel.
  // Il raycast (occlude={true}) usava un solo raggio verso il centro: qualsiasi oggetto sulla linea
  // nascondeva l'intera dashboard e lampeggiava la base del video wall.
  // Da nascosto il piano non si disegna, altrimenti il buco mostrerebbe la pagina dietro il canvas.
  return (
    <Html
      transform
      occlude="blending"
      position={[WX, WY, FRONT_Z]}
      scale={SCALE}
      zIndexRange={[5, 0]}
      className="pointer-events-none select-none"
      material={<shaderMaterial side={DoubleSide} fragmentShader={HOLE_FRAGMENT} visible={!hidden} />}
    >
      <div style={{ visibility: hidden ? 'hidden' : 'visible' }}>
        <SocDashboard />
      </div>
    </Html>
  )
}
