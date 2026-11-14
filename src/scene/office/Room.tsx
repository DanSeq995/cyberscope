import { Grid } from '@react-three/drei'

import { useGameStore } from '@/state/game'

import { FloorSurface } from './FloorSurface'
import { FLOOR_EDGE_BLEED, RED_ROOM, ROOM, WING, ZONES } from './layout'

const bleed = FLOOR_EDGE_BLEED

/** Pavimento dell'ala est: parte da sotto il muro est (soglia della porta) e arriva al muro di fondo. */
const WING_FLOOR = {
  width: WING.maxX - ROOM.width / 2 + bleed * 2,
  depth: WING.maxZ - WING.minZ + bleed * 2,
  x: (WING.maxX + ROOM.width / 2) / 2,
  z: (WING.minZ + WING.maxZ) / 2,
}

/** Pavimento della stanza del red team (staccata dall'ufficio). */
const RED_FLOOR = {
  width: RED_ROOM.maxX - RED_ROOM.minX + bleed * 2,
  depth: RED_ROOM.maxZ - RED_ROOM.minZ + bleed * 2,
  x: (RED_ROOM.minX + RED_ROOM.maxX) / 2,
  z: (RED_ROOM.minZ + RED_ROOM.maxZ) / 2,
}

const MAIN_FLOOR = {
  width: ROOM.width + bleed * 2,
  depth: ROOM.depth + bleed * 2,
}

/** Pavimento texture, overlay zone (solo pianta) e griglia debug. */
export function Room() {
  const mapView = useGameStore((s) => s.view === 'map')

  return (
    <group>
      <FloorSurface width={MAIN_FLOOR.width} depth={MAIN_FLOOR.depth} />
      <FloorSurface width={WING_FLOOR.width} depth={WING_FLOOR.depth} centerX={WING_FLOOR.x} centerZ={WING_FLOOR.z} />
      <FloorSurface width={RED_FLOOR.width} depth={RED_FLOOR.depth} centerX={RED_FLOOR.x} centerZ={RED_FLOOR.z} />

      {mapView &&
        ZONES.map((zone) => (
          <mesh
            key={zone.id}
            rotation-x={-Math.PI / 2}
            position={[zone.center[0], 0.008, zone.center[1]]}
            receiveShadow
          >
            <planeGeometry args={zone.size} />
            <meshStandardMaterial color={zone.color} transparent opacity={0.18} depthWrite={false} />
          </mesh>
        ))}

      {mapView && (
        <>
          <Grid
            position={[0, 0.012, 0]}
            args={[ROOM.width, ROOM.depth]}
            cellSize={1}
            cellThickness={0.6}
            cellColor="#7c818a"
            sectionSize={0}
            fadeDistance={60}
          />
          <Grid
            position={[8, 0.012, (WING.minZ + WING.maxZ) / 2]}
            args={[4, WING.maxZ - WING.minZ]}
            cellSize={1}
            cellThickness={0.6}
            cellColor="#7c818a"
            sectionSize={0}
            fadeDistance={60}
          />
          <Grid
            position={[RED_FLOOR.x, 0.012, RED_FLOOR.z]}
            args={[RED_ROOM.maxX - RED_ROOM.minX - 1, RED_ROOM.maxZ - RED_ROOM.minZ]}
            cellSize={1}
            cellThickness={0.6}
            cellColor="#7c818a"
            sectionSize={0}
            fadeDistance={60}
          />
        </>
      )}
    </group>
  )
}