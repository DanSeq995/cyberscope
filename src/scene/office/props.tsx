import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

import { selectHostAlarmed, useSocStore } from '@/state/soc'

import { GreyBox } from './GreyBox'
import { DeskComputerModel } from './DeskComputer'
import { DESK_CHAIR_GLB, DESK_FLOOR_LIFT, DESK_PC_TOWARD_MONITOR, prepareDeskChair } from './deskChairFit'
import { DESK_PCS, MONITOR, RACK_FRONT_Z, type DeskPcId, type Facing, type Vec2 } from './layout'
import { RackCabinetModel } from './ServerModel'

useGLTF.preload(DESK_CHAIR_GLB)

interface PlacedProps {
  position: Vec2
  facing: Facing
}

/** Postazione con GLB scrivania+sedia e PC sul piano di lavoro misurato. */
export function Workstation({ position: [x, z], facing, pc }: PlacedProps & { pc?: DeskPcId }) {
  const { scene } = useGLTF(DESK_CHAIR_GLB)
  const { root, layout } = useMemo(() => prepareDeskChair(scene), [scene])
  const yaw = layout.baseYaw + (facing === -1 ? 0 : Math.PI)
  const monitorLocalZ = MONITOR.offset + DESK_PC_TOWARD_MONITOR

  return (
    <group position={[x, DESK_FLOOR_LIFT, z]} rotation={[0, yaw, 0]}>
      <primitive object={root} />
      <group position={[0, layout.deskTopY, monitorLocalZ]} rotation={[0, Math.PI, 0]}>
        <DeskComputerModel screenColor={pc ? DESK_PCS[pc].screenColor : undefined} />
      </group>
    </group>
  )
}

/** Scrivania singola dell'open space con la sua postazione. */
export function Desk({ position, facing, pc }: PlacedProps & { pc?: DeskPcId }) {
  return <Workstation position={position} facing={facing} pc={pc} />
}

/** Rack 42U con fronte verso +z: GLB a tutta altezza; switch/patch panel su rack popolati. Rosso se l'host è sotto attacco. */
export function Rack({ position: [x, z], host, empty }: { position: Vec2; host: string; empty?: boolean }) {
  const front = RACK_FRONT_Z(z)
  const alarmed = useSocStore(selectHostAlarmed(host))
  return (
    <group>
      <group position={[x, 0, front]}>
        <RackCabinetModel alarmed={alarmed} />
      </group>
      {!empty && (
        <>
          <GreyBox kind="interactive" position={[x, 1.45, front]} size={[0.48, 0.09, 0.02]} />
          <GreyBox kind="interactive" position={[x, 1.3, front]} size={[0.48, 0.09, 0.02]} />
        </>
      )}
    </group>
  )
}