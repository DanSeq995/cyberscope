import type { KeyboardControlsEntry } from '@react-three/drei'

export type Control = 'forward' | 'back' | 'left' | 'right' | 'run'

/** Mappa tasti: WASD o frecce per muoversi, Shift per correre. */
export const KEY_MAP: KeyboardControlsEntry<Control>[] = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]
