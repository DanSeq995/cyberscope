/** Modello dati del simulatore di rete del PC del sistemista (stile Packet Tracer, senza CLI). */

export type DeviceKind = 'router' | 'switch' | 'firewall' | 'server' | 'pc' | 'cloud'

export interface Port {
  name: string
  /** Stato della porta: sui router nasce spenta, come in Packet Tracer. */
  on: boolean
  ip: string
  mask: string
}

export type FwAction = 'permit' | 'deny'
/** ip = qualsiasi protocollo. */
export type FwProtocol = 'ip' | 'tcp' | 'udp' | 'icmp'

/** Regola del firewall: sorgente/destinazione come `any`, indirizzo o rete CIDR; porta `any` o numero. */
export interface FwRule {
  id: string
  action: FwAction
  protocol: FwProtocol
  source: string
  destination: string
  port: string
}

export interface Device {
  id: string
  kind: DeviceKind
  name: string
  /** Posizione nell'area di lavoro (unità del viewBox SVG). */
  x: number
  y: number
  /** Apparato già in produzione: non si sposta, non si elimina, configurazione in sola lettura. */
  locked?: true
  ports: Port[]
  /** Default gateway (server e PC). */
  gateway?: string
  /** Regole in ordine di valutazione (first match); in fondo c'è sempre un deny implicito. */
  rules?: FwRule[]
  /** Nota mostrata nella finestra di configurazione. */
  note?: string
}

export interface Endpoint {
  device: string
  port: string
}

export interface Link {
  id: string
  a: Endpoint
  b: Endpoint
  locked?: true
}

export interface Topology {
  devices: Device[]
  links: Link[]
}

/** ok = superato · fail = fallito (con il motivo) · skip = non eseguito perché un controllo precedente è fallito. */
export type CheckStatus = 'ok' | 'fail' | 'skip'

export interface Check {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export interface Mail {
  id: string
  from: string
  role: string
  subject: string
  time: string
  /** Paragrafi; quelli che iniziano con "- " sono voci di elenco. */
  body: string[]
}
