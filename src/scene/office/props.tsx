import { selectHostAlarmed, useSocStore } from '@/state/soc'

import { ALARM_MATERIAL, DARK_MATERIAL, GreyBox, GreyCylinder } from './GreyBox'
import { DESK, DESK_PCS, MONITOR, RACK, type DeskPcId, type Facing, type Vec2 } from './layout'

interface PlacedProps {
  position: Vec2
  facing: Facing
}

/** Monitor + PC + sedia, posizionati rispetto al centro di un piano scrivania. */
export function Workstation({ position: [x, z], facing, pc }: PlacedProps & { pc?: DeskPcId }) {
  const top = DESK.height
  const chairZ = z - facing * 0.85
  const monitorZ = z + facing * MONITOR.offset
  return (
    <group>
      {/* Monitor sul bordo lontano dall'operatore; quelli utilizzabili sono scuri con lo schermo acceso */}
      <GreyBox
        kind="interactive"
        material={pc ? DARK_MATERIAL : undefined}
        position={[x, top + MONITOR.aboveDesk, monitorZ]}
        size={[...MONITOR.size]}
      />
      {pc && (
        <mesh position={[x, top + MONITOR.aboveDesk, monitorZ - facing * (MONITOR.size[2] / 2 + 0.002)]}>
          <boxGeometry args={[...DESK_PCS[pc].screen, 0.002]} />
          <meshBasicMaterial color={DESK_PCS[pc].screenColor} />
        </mesh>
      )}
      <GreyBox material={DARK_MATERIAL} position={[x, top + 0.06, z + facing * 0.22]} size={[0.08, 0.12, 0.08]} />
      {/* PC tower sotto il piano */}
      <GreyBox material={DARK_MATERIAL} position={[x + 0.55, 0.225, z + facing * 0.1]} size={[0.2, 0.45, 0.45]} />
      {/* Sedia: seduta, schienale, colonna */}
      <GreyBox position={[x, 0.46, chairZ]} size={[0.5, 0.08, 0.5]} />
      <GreyBox position={[x, 0.78, chairZ - facing * 0.24]} size={[0.5, 0.56, 0.06]} />
      <GreyCylinder position={[x, 0.21, chairZ]} radius={0.04} height={0.42} />
    </group>
  )
}

/** Scrivania singola dell'open space con la sua postazione. */
export function Desk({ position, facing, pc }: PlacedProps & { pc?: DeskPcId }) {
  const [x, z] = position
  return (
    <group>
      <GreyBox position={[x, DESK.height / 2, z]} size={[DESK.width, DESK.height, DESK.depth]} />
      <Workstation position={position} facing={facing} pc={pc} />
    </group>
  )
}

/** Rack 42U con fronte verso +z: switch e patch panel sono punti di interazione. Diventa rosso se il suo server è sotto attacco. */
export function Rack({ position: [x, z], host, empty }: { position: Vec2; host: string; empty?: boolean }) {
  const front = z + RACK.depth / 2 + 0.01
  const alarmed = useSocStore(selectHostAlarmed(host))
  return (
    <group>
      <GreyBox material={alarmed ? ALARM_MATERIAL : DARK_MATERIAL} position={[x, RACK.height / 2, z]} size={[RACK.width, RACK.height, RACK.depth]} />
      {!empty && (
        <>
          <GreyBox kind="interactive" position={[x, 1.45, front]} size={[0.48, 0.09, 0.02]} />
          <GreyBox kind="interactive" position={[x, 1.3, front]} size={[0.48, 0.09, 0.02]} />
        </>
      )}
    </group>
  )
}
