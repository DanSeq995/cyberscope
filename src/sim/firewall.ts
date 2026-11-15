/**
 * Configurazione simulata del firewall fw-01 e domanda della fase di risoluzione.
 * Le policy si valutano dall'alto verso il basso: vince la prima che corrisponde (first match).
 */

export interface FirewallPolicy {
  id: string
  action: 'permit' | 'deny'
  source: string
  destination: string
  service: string
  note: string
  hits: number
  lastHit?: string
}

export const INITIAL_POLICIES: FirewallPolicy[] = [
  {
    id: 'R1',
    action: 'permit',
    source: 'LAN uffici 10.0.1.0/24',
    destination: 'Server srv-*',
    service: 'tcp/22, tcp/3389',
    note: 'Amministrazione server dagli uffici',
    hits: 1824,
  },
  {
    id: 'R2',
    action: 'permit',
    source: 'LAN uffici 10.0.1.0/24',
    destination: 'Internet',
    service: 'tcp/80, tcp/443',
    note: 'Navigazione uffici',
    hits: 48210,
  },
  {
    id: 'R3',
    action: 'permit',
    source: 'Ospiti 192.168.50.0/24',
    destination: 'Internet',
    service: 'tcp/80, tcp/443',
    note: 'Navigazione Wi-Fi ospiti',
    hits: 9377,
  },
  {
    id: 'R4',
    action: 'permit',
    source: 'any',
    destination: 'srv-01',
    service: 'any',
    note: 'Temporanea: test fornitore',
    hits: 3,
    lastHit: '192.168.50.23 → srv-01:3389',
  },
]

/** Policy di default, sempre in fondo e non modificabile. */
export const DEFAULT_POLICY: FirewallPolicy = {
  id: '—',
  action: 'deny',
  source: 'any',
  destination: 'any',
  service: 'any',
  note: 'Default: blocca tutto il resto',
  hits: 0,
}

/** Policy aggiunta con la risposta giusta (in cima alla lista). */
export const FIX_POLICY: FirewallPolicy = {
  id: 'R0',
  action: 'deny',
  source: 'Ospiti 192.168.50.0/24',
  destination: 'srv-01',
  service: 'tcp/3389',
  note: 'Blocca RDP dalla rete ospiti',
  hits: 1,
  lastHit: '192.168.50.23 → srv-01:3389',
}

export interface QuizOption {
  id: string
  /** La policy proposta, come appare nella console. */
  policy: string
  /** Dove verrebbe inserita. */
  position: string
  correct: boolean
  explanation: string
}

export const QUESTION = 'Quale policy vuoi usare per bloccare l’accesso RDP dalla rete ospiti a srv-01?'

export const OPTIONS: QuizOption[] = [
  {
    id: 'top-specific',
    policy: 'deny tcp 192.168.50.0/24 → srv-01 porta 3389',
    position: 'in cima alla lista, prima di R4',
    correct: true,
    explanation:
      'Giusto! Le policy si leggono dall’alto e vince la prima che corrisponde: messa prima di R4, blocca il Desktop remoto dalla rete ospiti senza toccare il resto del traffico.',
  },
  {
    id: 'deny-all',
    policy: 'deny any → any',
    position: 'in cima alla lista',
    correct: false,
    explanation:
      'Troppo drastica: in cima alla lista blocca tutto il traffico, compreso il lavoro degli uffici (R1, R2) e la navigazione degli ospiti (R3).',
  },
  {
    id: 'bottom-specific',
    policy: 'deny tcp 192.168.50.0/24 → srv-01 porta 3389',
    position: 'in fondo alla lista, dopo R4',
    correct: false,
    explanation:
      'La regola è giusta ma nel posto sbagliato: R4 (permit any → srv-01) corrisponde prima e lascia passare il traffico, quindi questa policy non scatterebbe mai.',
  },
]

/** Lezione finale mostrata dopo la risposta giusta. */
export const TAKEAWAY =
  'Nota: R4 resta pericolosa. Le regole “temporanee” troppo larghe vanno rimosse appena finito il test.'

/** Suggerimento "Indizio sul log" (Analisi Assistita a pagamento nella console). */
export const LOG_HINT =
  'Nel log del firewall la connessione 192.168.50.23 → srv-01:3389 risulta consentita dalla regola R4. Le policy si leggono dall’alto: la regola che blocca deve essere letta prima di R4, e deve fermare solo quel traffico (rete ospiti, srv-01, porta 3389).'

/**
 * Risposta sbagliata che il 50/50 toglie di mezzo: scelta a caso una volta per sessione, così resta la stessa
 * anche chiudendo e riaprendo il portatile.
 */
export const FIFTY_TARGET = (() => {
  const wrong = OPTIONS.filter((o) => !o.correct)
  return wrong[Math.floor(Math.random() * wrong.length)].id
})()
