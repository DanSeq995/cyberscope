import { Grid } from '@react-three/drei'

import { RED_ROOM, ROOM, WING, ZONES } from './layout'

/** Pavimento dell'ala est: parte da sotto il muro est (soglia della porta) e arriva al muro di fondo. */
const WING_FLOOR = {
  width: WING.maxX - ROOM.width / 2,
  depth: WING.maxZ - WING.minZ,
  x: (WING.maxX + ROOM.width / 2) / 2,
  z: (WING.minZ + WING.maxZ) / 2,
}

/** Pavimento della stanza del red team (staccata dall'ufficio). */
const RED_FLOOR = {
  width: RED_ROOM.maxX - RED_ROOM.minX,
  depth: RED_ROOM.maxZ - RED_ROOM.minZ,
  x: (RED_ROOM.minX + RED_ROOM.maxX) / 2,
  z: (RED_ROOM.minZ + RED_ROOM.maxZ) / 2,
}

/** Pavimento della stanza, macchie colorate delle zone e griglia da 1 m. */
export function Room() {
  return (
    <group>
      {/* Terreno esterno */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1c1f2a" />
      </mesh>

      {/* Pavimento della stanza */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#b4b8bf" roughness={1} />
      </mesh>

      {/* Pavimento della stanza del nuovo team */}
      <mesh rotation-x={-Math.PI / 2} position={[WING_FLOOR.x, 0, WING_FLOOR.z]} receiveShadow>
        <planeGeometry args={[WING_FLOOR.width, WING_FLOOR.depth]} />
        <meshStandardMaterial color="#b4b8bf" roughness={1} />
      </mesh>

      {/* Pavimento della stanza del red team */}
      <mesh rotation-x={-Math.PI / 2} position={[RED_FLOOR.x, 0, RED_FLOOR.z]} receiveShadow>
        <planeGeometry args={[RED_FLOOR.width, RED_FLOOR.depth]} />
        <meshStandardMaterial color="#b4b8bf" roughness={1} />
      </mesh>

      {ZONES.map((zone) => (
        <mesh
          key={zone.id}
          rotation-x={-Math.PI / 2}
          position={[zone.center[0], 0.003, zone.center[1]]}
          receiveShadow
        >
          <planeGeometry args={zone.size} />
          <meshStandardMaterial color={zone.color} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}

      <Grid
        position={[0, 0.006, 0]}
        args={[ROOM.width, ROOM.depth]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#7c818a"
        sectionSize={0}
        fadeDistance={60}
      />
      {/* Griglia dell'ala: centrata su coordinate intere, così le celle da 1 m restano allineate */}
      <Grid
        position={[8, 0.006, WING_FLOOR.z]}
        args={[4, WING_FLOOR.depth]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#7c818a"
        sectionSize={0}
        fadeDistance={60}
      />
      {/* Griglia della stanza del red team: larga 4 m attorno al centro, così le celle restano su coordinate intere */}
      <Grid
        position={[RED_FLOOR.x, 0.006, RED_FLOOR.z]}
        args={[RED_FLOOR.width - 1, RED_FLOOR.depth]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#7c818a"
        sectionSize={0}
        fadeDistance={60}
      />
    </group>
  )
}
