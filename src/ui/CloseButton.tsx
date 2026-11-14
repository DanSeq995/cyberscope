import { closeComputer } from './computer'

/** Pulsante ✕ dei PC a tutto schermo: chiude con l'animazione e ricattura il mouse (il click è un gesto valido). */
export function CloseButton({ label = 'Chiudi', dark = false }: { label?: string; dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => closeComputer(true)}
      className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
        dark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-300/70 hover:text-slate-900'
      }`}
    >
      <span aria-hidden>✕</span>
      {label}
    </button>
  )
}
