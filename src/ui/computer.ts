import { lockPointer } from '@/lib/pointer'
import { useGameStore } from '@/state/game'

/**
 * Chiude il PC aperto (portatile o PC da scrivania) con l'animazione di ritorno.
 * `relock` = ricattura subito il mouse: solo dentro un gesto valido (tasto E, click su ✕), non con Esc.
 */
export function closeComputer(relock: boolean) {
  const game = useGameStore.getState()
  const laptopUp = game.laptop === 'open' || game.laptop === 'opening'
  const deskUp = game.desk === 'open' || game.desk === 'opening'
  if (!laptopUp && !deskUp) return false
  if (relock) lockPointer()
  if (laptopUp) game.setLaptop('closing')
  if (deskUp) game.setDesk('closing')
  return true
}

/** true se il tasto è stato premuto dentro un campo di testo: le scorciatoie di gioco vanno ignorate. */
export function isTyping(e: KeyboardEvent) {
  const el = e.target
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
}
