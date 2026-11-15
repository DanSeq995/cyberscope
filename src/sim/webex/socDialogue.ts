/**
 * Dialogo scriptato nella stanza «Blue Team SOC» all'apertura dell'incidente (primo alert Splunk):
 * l'Analista SOC segnala l'RDP dalla rete guest, l'Amministratore di rete (il giocatore) risponde.
 * Resta locale: non viene inviato alla room Webex.
 */
export interface DialogueLine {
  author: string
  /** true = battuta del giocatore (Amministratore di rete), mostrata a destra. */
  own: boolean
  /** Millisecondi dall'apertura dell'incidente. */
  delay: number
  text: string
}

export const DIALOGUE_ID_PREFIX = 'soc-dialogue-'
/** Dialogo di benvenuto: non viene tolto quando T azzera la simulazione. */
export const INTRO_ID_PREFIX = 'intro-dialogue-'

/** Battute dell'admin: scritte da sole nel campo della chat, una lettera ogni MS_PER_CHAR, poi inviate. */
export const MS_PER_CHAR = 28
/** Battute degli altri: «sta scrivendo…» per questo tempo prima che arrivino. */
export const OTHER_TYPING_MS = 1500

/** Anche le battute brevi si scrivono per almeno questo tempo, altrimenti non si vedono. */
export const MIN_TYPING_MS = 1200

/** Quanto prima di `delay` comincia la scrittura della battuta. */
export const typingDuration = (line: DialogueLine) =>
  line.own ? Math.max(MIN_TYPING_MS, line.text.length * MS_PER_CHAR) : OTHER_TYPING_MS

/**
 * Prima dell'incidente, al primo ingresso in gioco del blue team: admin e analista si danno appuntamento
 * al PC Biblioteca per studiare e guadagnare Knowledge Credits.
 */
export const INTRO_DIALOGUE: readonly DialogueLine[] = [
  { author: 'Amministratore di rete', own: true, delay: 3000, text: 'Ehi, ci sei?' },
  {
    author: 'Analista SOC',
    own: false,
    delay: 7000,
    text: 'Sì, ci sono! Approfittiamo della calma per studiare un po’, così siamo pronti per qualsiasi emergenza.',
  },
  {
    author: 'Amministratore di rete',
    own: true,
    delay: 12000,
    text: 'Ottima idea: passo dal PC Biblioteca, così guadagniamo anche qualche Knowledge Credit che ci tornerà utile.',
  },
]

export const SOC_DIALOGUE: readonly DialogueLine[] = [
  {
    author: 'Analista SOC',
    own: false,
    delay: 2000,
    text:
      'Dall’analisi dei log di Splunk, ho rilevato che un dispositivo appartenente alla rete guest ha stabilito con ' +
      'successo una connessione verso la porta TCP 3389 (RDP) del server interno SRV-01.',
  },
  {
    author: 'Amministratore di rete',
    own: true,
    delay: 7000,
    text:
      'Hai ragione, la porta 3389 del servizio RDP sul server interno SRV-01 risulta ancora esposta alla rete guest. ' +
      'Si tratta di una regola del firewall che non abbiamo correttamente configurato.',
  },
  {
    author: 'Amministratore di rete',
    own: true,
    delay: 12000,
    text:
      'Provvedo immediatamente a modificare la regola dalla console di amministrazione del firewall, bloccando le ' +
      'connessioni RDP provenienti dalla rete guest.',
  },
]
