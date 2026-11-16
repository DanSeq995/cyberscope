import { Html } from '@react-three/drei'
import type { ReactNode } from 'react'
import { DoubleSide } from 'three'

import { useGameStore } from '@/state/game'
import { LibraryScreen } from '@/ui/study/StudyTheory'
import { DesktopScreen } from '@/ui/work/WorkDesktop'

import { DESK_PCS, type DeskPcId } from '../office/layout'

/**
 * Larghezza in px della pagina disegnata sul monitor: circa quella dell'overlay a tutto schermo su un display
 * 1080p, così l'impaginazione da lontano è la stessa che si vede dopo lo zoom.
 */
const PAGE_WIDTH = 1600
/** Distanza (m) dal pannello del monitor, verso l'operatore: evita lo z-fighting col piano colorato. */
const FRONT_OFFSET = 0.004

/** Stesso shader del piano di occlusione di drei: scrive alpha 0 e "buca" il canvas sopra l'HTML. */
const HOLE_FRAGMENT = /* glsl */ `
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
`

/** Pagina HTML in sola lettura sul monitor 3D di un PC da scrivania (stessa tecnica del video wall). */
function MonitorPage({ pc, children }: { pc: DeskPcId; children: (style: { width: number; height: number }) => ReactNode }) {
  // Solo blue team: visibility (non smontare), rimontare Html riattiverebbe il bug drei/React 19 StrictMode.
  const hidden = useGameStore((s) => s.team !== 'blue')
  const { center, facing, screen } = DESK_PCS[pc]
  const [w, h] = screen
  const height = Math.round((PAGE_WIDTH * h) / w)
  // drei Html transform: 1 px = 0,025 m × scale.
  const scale = w / PAGE_WIDTH / 0.025

  return (
    <Html
      transform
      occlude="blending"
      position={[center[0], center[1], center[2] - facing * FRONT_OFFSET]}
      // Il pannello guarda verso l'operatore (-facing lungo z); Html guarda +z di default.
      rotation={[0, facing === -1 ? 0 : Math.PI, 0]}
      scale={scale}
      zIndexRange={[5, 0]}
      className="pointer-events-none select-none"
      material={<shaderMaterial side={DoubleSide} fragmentShader={HOLE_FRAGMENT} visible={!hidden} />}
    >
      <div style={{ visibility: hidden ? 'hidden' : 'visible' }} aria-hidden>
        {children({ width: PAGE_WIDTH, height })}
      </div>
    </Html>
  )
}

/**
 * Anteprime dal vivo dei PC Biblioteca e del sistemista: da lontano il monitor mostra già la schermata che si
 * apre con E, così lo zoom della camera passa all'overlay a tutto schermo senza stacco.
 */
export function DeskScreens() {
  return (
    <>
      <MonitorPage pc="study">{(style) => <LibraryScreen style={style} active={false} preview />}</MonitorPage>
      <MonitorPage pc="work">{(style) => <DesktopScreen style={style} preview />}</MonitorPage>
    </>
  )
}
