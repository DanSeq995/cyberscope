import { Html } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'

import { useGameStore } from '@/state/game'

import { GreyBox, GreyCylinder } from './GreyBox'
import { ITEM_LABELS, LAYOUT, RED_ROOM, ROOM, ZONES, type LayoutItem } from './layout'
import { Desk, Rack, Workstation } from './props'
import { Room } from './Room'

function renderItem(item: LayoutItem) {
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
    case 'desk':
      return <Desk key={item.id} position={item.position} facing={item.facing} pc={item.pc} />
    case 'workstation':
      return <Workstation key={item.id} position={item.position} facing={item.facing} pc={item.pc} />
    case 'rack':
      return <Rack key={item.id} position={item.position} host={item.host} empty={item.empty} />
  }
}

function Label({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} center className="pointer-events-none select-none">
      <span className="whitespace-nowrap rounded bg-black/60 px-2 py-0.5 text-xs text-white">{text}</span>
    </Html>
  )
}

/** Greybox dell'ufficio del blue team: primitive con collider statici, nessuna interazione. */
export function Office() {
  const showLabels = useGameStore((s) => s.view === 'map')
  // In vista pianta ogni squadra vede solo le etichette della propria stanza.
  const red = useGameStore((s) => s.team === 'red')
  const mine = (x: number) => x <= RED_ROOM.maxX === red

  return (
    <group>
      <Room />

      {/* Pavimento fisico */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[20, 0.1, 20]} position={[0, -0.1, 0]} />
      </RigidBody>

      {/* Un collider a box per ogni mesh della greybox (muri, arredi, vetrate) */}
      <RigidBody type="fixed" colliders="cuboid">
        {LAYOUT.map(renderItem)}
      </RigidBody>

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
