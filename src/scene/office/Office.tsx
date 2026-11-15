import { Html } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'

import { useGameStore } from '@/state/game'

import { Ceiling } from './Ceiling'
import { OfficeDoorGroup } from './OfficeDoorGroup'
import { GreyBox, GreyCylinder } from './GreyBox'
import { DESK_CHAIR_LAYOUT, DESK_FLOOR_LIFT } from './deskChairFit'
import {
  DESK,
  ITEM_LABELS,
  LAYOUT,
  RACK,
  RACK_VISUAL_Z_OFFSET,
  RED_ROOM,
  ROOM,
  ZONES,
  type DeskItem,
  type Facing,
  type LayoutItem,
  type RackItem,
  type WorkstationItem,
} from './layout'
import { Desk, Rack, Workstation } from './props'
import { Room } from './Room'
import { WallWindow } from './WallWindow'

function renderSolid(item: LayoutItem) {
  switch (item.type) {
    case 'box':
      return <GreyBox key={item.id} kind={item.kind} position={item.position} size={item.size} />
    case 'cylinder':
      return (
        <GreyCylinder
          key={item.id}
          kind={item.kind}
          position={item.position}
          radius={item.radius}
          height={item.height}
        />
      )
    default:
      return null
  }
}

function renderProp(item: LayoutItem) {
  switch (item.type) {
    case 'desk':
      return <Desk key={item.id} position={item.position} facing={item.facing} pc={item.pc} />
    case 'workstation':
      return <Workstation key={item.id} position={item.position} facing={item.facing} pc={item.pc} />
    case 'rack':
      return <Rack key={item.id} position={item.position} host={item.host} empty={item.empty} />
    default:
      return null
  }
}

function deskYaw(facing: Facing) {
  return DESK_CHAIR_LAYOUT.baseYaw + (facing === -1 ? 0 : Math.PI)
}

/** Un box greybox per postazione: stessi ingombri del layout, senza collider per-mesh sui GLB. */
function DeskCollider({ position: [x, z], facing }: Pick<DeskItem, 'position' | 'facing'>) {
  const y = DESK_FLOOR_LIFT + DESK.height / 2
  return (
    <RigidBody type="fixed" colliders={false} position={[x, y, z]} rotation={[0, deskYaw(facing), 0]}>
      <CuboidCollider args={[DESK.width / 2, DESK.height / 2, DESK.depth / 2]} />
    </RigidBody>
  )
}

function RackCollider({ position: [x, z] }: Pick<RackItem, 'position'>) {
  return (
    <RigidBody type="fixed" colliders={false} position={[x, RACK.height / 2, z + RACK_VISUAL_Z_OFFSET]}>
      <CuboidCollider args={[RACK.width / 2, RACK.height / 2, RACK.depth / 2]} />
    </RigidBody>
  )
}

function isPlacedDesk(item: LayoutItem): item is DeskItem | WorkstationItem {
  return item.type === 'desk' || item.type === 'workstation'
}

function Label({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} center className="pointer-events-none select-none">
      <span className="whitespace-nowrap rounded bg-black/60 px-2 py-0.5 text-xs text-white">{text}</span>
    </Html>
  )
}

/** Ufficio: GLB solo grafici; fisica su muri greybox + collider semplificati scrivanie/rack. */
export function Office() {
  const showLabels = useGameStore((s) => s.view === 'map')
  const red = useGameStore((s) => s.team === 'red')
  const mine = (x: number) => x <= RED_ROOM.maxX === red

  const solids = LAYOUT.filter((item) => item.type === 'box' || item.type === 'cylinder')
  const props = LAYOUT.filter((item) => item.type === 'desk' || item.type === 'workstation' || item.type === 'rack')
  const placedDesks = LAYOUT.filter(isPlacedDesk)
  const racks = LAYOUT.filter((item): item is RackItem => item.type === 'rack')

  return (
    <group>
      <Room />
      <Ceiling />
      <OfficeDoorGroup />
      <WallWindow />

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[20, 0.1, 20]} position={[0, -0.1, 0]} />
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        {solids.map(renderSolid)}
      </RigidBody>

      {placedDesks.map((item) => (
        <DeskCollider key={`col-${item.id}`} position={item.position} facing={item.facing} />
      ))}
      {racks.map((item) => (
        <RackCollider key={`col-${item.id}`} position={item.position} />
      ))}

      {props.map(renderProp)}

      {showLabels && (
        <>
          {ZONES.filter((zone) => mine(zone.center[0])).map((zone) => (
            <Label
              key={zone.id}
              position={[zone.center[0], ROOM.height + 0.4, zone.center[1]]}
              text={zone.label}
            />
          ))}
          {ITEM_LABELS.filter((l) => mine(l.position[0])).map((l) => (
            <Label key={l.id} position={l.position} text={l.label} />
          ))}
        </>
      )}
    </group>
  )
}