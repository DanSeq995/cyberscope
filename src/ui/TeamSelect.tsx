import type { Team } from '@/scene/office/layout'
import { useGameStore } from '@/state/game'

import { NewGameButton } from './NewGameButton'

const TEAMS: { id: Team; name: string; role: string; text: string; accent: string }[] = [
  {
    id: 'blue',
    name: 'Blue team',
    role: 'Difesa',
    text: 'Sei nell’ufficio: tieni d’occhio il SOC, rispondi all’incidente dal firewall, studia la teoria e gestisci le richieste al sistemista.',
    accent: 'border-sky-500/60 hover:border-sky-400 hover:bg-sky-950/60 [&_h2]:text-sky-300',
  },
  {
    id: 'red',
    name: 'Red team',
    role: 'Attacco simulato',
    text: 'Sei nella stanza del red team, collegato alla rete ospiti: ripercorri l’attacco fase per fase dal terminale e ottieni un punteggio.',
    accent: 'border-rose-500/60 hover:border-rose-400 hover:bg-rose-950/60 [&_h2]:text-rose-300',
  },
]

/** Prima schermata: scelta della squadra. Le due partite si giocano in stanze non collegate. */
export function TeamSelect() {
  const chooseTeam = useGameStore((s) => s.chooseTeam)
  return (
    <div
      // Sopra la scena e l'HUD; i click non devono arrivare al documento (ricatturerebbero il mouse).
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#0f1117] p-4 text-white"
    >
      <div className="w-full max-w-2xl">
        <h1 className="text-center text-2xl font-semibold">Clara Netroom</h1>
        <p className="mt-1 mb-6 text-center text-sm text-white/70">Scegli con quale squadra giocare</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {TEAMS.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => chooseTeam(team.id)}
              className={`cursor-pointer rounded-lg border bg-neutral-900/90 p-5 text-left transition-colors ${team.accent}`}
            >
              <div className="text-xs tracking-wide text-white/60 uppercase">{team.role}</div>
              <h2 className="mb-2 text-xl font-semibold">{team.name}</h2>
              <p className="text-sm text-white/80">{team.text}</p>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-white/50">
          Potrai cambiare squadra dalla schermata di pausa (Esc). Crediti e progressi valgono per una
          partita: ricaricando la pagina si riparte da zero.
        </p>
        <div className="mt-3 flex justify-center">
          <NewGameButton />
        </div>
      </div>
    </div>
  )
}
