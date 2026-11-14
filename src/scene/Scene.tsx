import {
  KeyboardControls,
  OrbitControls,
  PerspectiveCamera,
  PointerLockControls,
} from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'

import { useGameStore } from '@/state/game'

import { MAP_TARGETS } from './office/layout'
import { Office } from './office/Office'
import { KEY_MAP } from './player/controls'
import { Laptop } from './player/Laptop'
import { Player } from './player/Player'
import { FirewallStation } from './soc/FirewallStation'
import { SocDriver } from './soc/SocDriver'
import { DeskCamera } from './soc/DeskCamera'
import { VideoWall } from './soc/VideoWall'
import { TeamRack } from './work/TeamRack'

/** Camera in prima persona (posizione aggiornata dal Player) o vista pianta orbitale. */
function Cameras() {
  const view = useGameStore((s) => s.view)
  const setLocked = useGameStore((s) => s.setLocked)
  const [mapX, mapZ] = MAP_TARGETS[useGameStore((s) => s.team) ?? 'blue']

  if (view === 'fps') {
    return (
      <>
        <PerspectiveCamera makeDefault fov={70} near={0.05} far={100} />
        <PointerLockControls onLock={() => setLocked(true)} onUnlock={() => setLocked(false)} />
      </>
    )
  }

  return (
    <>
      <PerspectiveCamera makeDefault position={[mapX + 10, 11, mapZ + 13]} fov={45} />
      <OrbitControls
        makeDefault
        target={[mapX, 0.5, mapZ]}
        minDistance={3}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  )
}

export function Scene() {
  const blue = useGameStore((s) => s.team !== 'red')
  return (
    <KeyboardControls map={KEY_MAP}>
      <Canvas shadows>
        <color attach="background" args={['#0f1117']} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[6, 12, 8]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-16}
          shadow-camera-right={13}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
          shadow-bias={-0.0005}
        />

        <Cameras />
        <SocDriver />
        {/* Anelli guida e apparati delle challenge del blue team: nella stanza del red team non servono */}
        {blue && <FirewallStation />}
        {blue && <TeamRack />}
        <Laptop />
        <DeskCamera />

        <Suspense fallback={null}>
          <Physics>
            <Office />
            <Player />
          </Physics>
          {/* Dentro Suspense: montato dopo il caricamento di Rapier, evita un bug di drei Html
              con React 19 StrictMode al primo mount della scena (contenuto svuotato). */}
          <VideoWall />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  )
}
