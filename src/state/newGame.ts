import { useGameStore } from './game'
import { useKnowledgeStore } from './knowledge'
import { useRedStore } from './red'
import { useSocStore } from './soc'
import { useWorkStore } from './work'

/** Azzera la partita: Knowledge Credits e Training Lab (salvati nel browser), richiesta IT, incidente SOC, red team. */
export function startNewGame() {
  useKnowledgeStore.getState().resetAll()
  useWorkStore.getState().reset()
  useRedStore.getState().reset()
  // toggle a simulazione avviata la ferma e azzera tutto (compresi gli hint della console firewall).
  if (useSocStore.getState().phase !== 'idle') useSocStore.getState().toggle()
  // Torna al menu iniziale (scelta squadra); no-op se già lì.
  useGameStore.getState().leaveTeam()
}
