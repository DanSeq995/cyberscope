/**
 * Pointer lock condiviso tra gioco e PC a tutto schermo.
 * drei PointerLockControls cattura il contenitore degli eventi del Canvas (non il <canvas>): per ricatturare
 * lo stesso elemento ricordiamo quello catturato al momento del rilascio.
 */
let lastTarget: Element | null = null

/** Libera il mouse (cursore visibile) ricordando quale elemento lo teneva. */
export function releasePointer() {
  if (document.pointerLockElement) {
    lastTarget = document.pointerLockElement
    document.exitPointerLock()
  }
}

/**
 * Ricattura il mouse. Il browser lo consente solo durante un gesto dell'utente (click, tasto diverso da Esc):
 * va chiamata direttamente nel gestore dell'evento. Un eventuale rifiuto viene ignorato (resta la pausa).
 */
export function lockPointer() {
  const target = lastTarget ?? document.querySelector('canvas')?.parentElement?.parentElement
  if (!target || document.pointerLockElement === target) return
  try {
    void Promise.resolve(target.requestPointerLock()).catch(() => {})
  } catch {
    // Alcuni browser lanciano invece di rifiutare la promise.
  }
}
