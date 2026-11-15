import { DoubleSide } from 'three'

import { FLOOR_EDGE_BLEED, RED_ROOM, ROOM, WING } from './layout'

const H = ROOM.height
const bleed = FLOOR_EDGE_BLEED

const WING_FLOOR = {
  width: WING.maxX - ROOM.width / 2 + bleed * 2,
  depth: WING.maxZ - WING.minZ + bleed * 2,
  x: (WING.maxX + ROOM.width / 2) / 2,
  z: (WING.minZ + WING.maxZ) / 2,
}

const RED_FLOOR = {
  width: RED_ROOM.maxX - RED_ROOM.minX + bleed * 2,
  depth: RED_ROOM.maxZ - RED_ROOM.minZ + bleed * 2,
  x: (RED_ROOM.minX + RED_ROOM.maxX) / 2,
  z: (RED_ROOM.minZ + RED_ROOM.maxZ) / 2,
}

const MAIN = { width: ROOM.width + bleed * 2, depth: ROOM.depth + bleed * 2 }

const PANEL_EMISSIVE = '#ffb86c'

function CeilingPanel({
  width,
  depth,
  centerX = 0,
  centerZ = 0,
}: {
  width: number
  depth: number
  centerX?: number
  centerZ?: number
}) {
  return (
    <mesh position={[centerX, H, centerZ]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color="#ebe6df" roughness={0.95} side={DoubleSide} />
    </mesh>
  )
}

function OfficeNeonGrid({ centerX, centerZ, spanX, spanZ }: { centerX: number; centerZ: number; spanX: number; spanZ: number }) {
  const xs = Math.max(1, Math.floor(spanX / 3.2))
  const zs = Math.max(1, Math.floor(spanZ / 3.2))
  const lights: { x: number; z: number }[] = []
  for (let iz = 0; iz < zs; iz++) {
    for (let ix = 0; ix < xs; ix++) {
      const x = centerX - spanX / 2 + (ix + 0.5) * (spanX / xs)
      const z = centerZ - spanZ / 2 + (iz + 0.5) * (spanZ / zs)
      lights.push({ x, z })
    }
  }

  return (
  <>
      {lights.map(({ x, z }) => (
        <group key={`${x}-${z}`} position={[x, H - 0.06, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[1.35, 0.42]} />
            <meshStandardMaterial
              color={PANEL_EMISSIVE}
              emissive={PANEL_EMISSIVE}
              emissiveIntensity={0.9}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </>
  )
}

/**
 * Soffitto opaco e plafoni caldi da ufficio. I plafoni sono solo emissivi: niente luci per
 * plafone (16 luci dinamiche costavano metà del frame); la luce calda arriva da `hemisphereLight` in `Scene.tsx`.
 */
export function Ceiling() {
  return (
    <group>
      <CeilingPanel width={MAIN.width} depth={MAIN.depth} />
      <CeilingPanel width={WING_FLOOR.width} depth={WING_FLOOR.depth} centerX={WING_FLOOR.x} centerZ={WING_FLOOR.z} />
      <CeilingPanel width={RED_FLOOR.width} depth={RED_FLOOR.depth} centerX={RED_FLOOR.x} centerZ={RED_FLOOR.z} />

      <OfficeNeonGrid centerX={0} centerZ={0} spanX={MAIN.width - 1} spanZ={MAIN.depth - 1} />
      <OfficeNeonGrid centerX={WING_FLOOR.x} centerZ={WING_FLOOR.z} spanX={WING_FLOOR.width - 0.5} spanZ={WING_FLOOR.depth - 0.5} />
      <OfficeNeonGrid centerX={RED_FLOOR.x} centerZ={RED_FLOOR.z} spanX={RED_FLOOR.width - 0.5} spanZ={RED_FLOOR.depth - 0.5} />
    </group>
  )
}