import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

import { useGameStore } from '@/state/game'
import { POLL_INTERVAL, useSocStore } from '@/state/soc'

import { ALARM_MATERIAL } from '../office/GreyBox'

/** Fa avanzare la simulazione: red team → HEC ogni frame, dashboard → REST ogni POLL_INTERVAL. */
export function SocDriver() {
  const sincePoll = useRef(0)

  useFrame(({ clock }, delta) => {
    // Clamp: se la scheda torna attiva dopo minuti non arriva tutto lo scenario in un frame.
    // La simulazione dell'incidente è del blue team: con l'altra squadra (o nella scelta) resta in pausa.
    if (useGameStore.getState().team !== 'blue') return
    const dt = Math.min(delta, 0.25)
    const { tick, poll } = useSocStore.getState()
    tick(dt)

    sincePoll.current += dt
    if (sincePoll.current >= POLL_INTERVAL) {
      sincePoll.current = 0
      void poll()
    }

    ALARM_MATERIAL.emissiveIntensity = 0.6 + 0.6 * Math.sin(clock.elapsedTime * 6)
  })

  return null
}
