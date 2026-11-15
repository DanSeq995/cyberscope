/** Scheda della barra di un browser in-game (portatile del firewall, PC Biblioteca). */
export function BrowserTab({
  active,
  label,
  dot,
  onSelect,
}: {
  active: boolean
  label: string
  /** Classe di colore del pallino (es. "bg-sky-500"). */
  dot: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-1.5 text-sm ${
        active ? 'bg-white font-semibold text-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      <span className={`size-2 rounded-full ${dot}`} />
      {label}
    </button>
  )
}
