/** Misure condivise tra il portatile 3D e la console HTML a tutto schermo (devono coincidere). */

/** Corpo del portatile: larghezza e profondità (m). */
export const LAPTOP_W = 0.36
export const LAPTOP_D = 0.25

/** Schermo sul coperchio (m): rapporto 33:21. */
export const SCREEN_W = LAPTOP_W - 0.03
export const SCREEN_H = LAPTOP_D - 0.04

/** Frazione dell'altezza della vista coperta dallo schermo a fine zoom. */
export const SCREEN_FILL = 0.95

/** Colore della cornice dello schermo, come appare illuminata (sfondo della console HTML). */
export const BEZEL_COLOR = '#30363e'
