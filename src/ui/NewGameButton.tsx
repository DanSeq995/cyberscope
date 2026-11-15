import { useState } from 'react'

import { startNewGame } from '@/state/newGame'

/** Pulsante "Nuova partita" con conferma inline (schermata di scelta squadra e pausa). */
export function NewGameButton() {
  const [confirm, setConfirm] = useState(false)
  const button = 'cursor-pointer rounded-md border px-3 py-1 text-sm'

  if (!confirm) {
    return (
      <button type="button" onClick={() => setConfirm(true)} className={`${button} border-white/30 text-white/80 hover:bg-white/10`}>
        Nuova partita
      </button>
    )
  }
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-2 text-sm text-white/80">
      Azzerare crediti e progressi?
      <button
        type="button"
        onClick={() => {
          startNewGame()
          setConfirm(false)
        }}
        className={`${button} border-red-400/70 text-red-200 hover:bg-red-500/20`}
      >
        Sì, azzera
      </button>
      <button type="button" onClick={() => setConfirm(false)} className={`${button} border-white/30 hover:bg-white/10`}>
        No
      </button>
    </span>
  )
}
