/**
 * Percorso del red team: cinque fasi, una domanda per fase, giocate dal PC della stanza del red team.
 * Ricostruisce, a scopo didattico, lo stesso incidente che il blue team indaga su Splunk
 * (vedi `redteam.ts` e `firewall.ts`): un dispositivo della rete Wi-Fi ospiti (192.168.50.23)
 * raggiunge il Desktop remoto (RDP, tcp/3389) del server privato srv-01 (10.0.2.11) grazie alla
 * regola di firewall R4 troppo permissiva ("permit any → srv-01").
 *
 * Le fasi seguono la catena MITRE ATT&CK (ID verificati su attack.mitre.org):
 *   1. T1016 System Network Configuration Discovery  (Discovery)
 *   2. T1018 Remote System Discovery                 (Discovery)
 *   3. T1046 Network Service Discovery               (Discovery)
 *   4. analisi della causa                           (nessuna tecnica)
 *   5. T1021.001 Remote Services: RDP                (Lateral Movement)
 *
 * Nota: è una simulazione a quiz. Nessun comando viene eseguito davvero e questo percorso NON
 * invia eventi a Splunk (è indipendente dalla partita del blue team). Indirizzi da `network/scenario.ts`.
 *
 * Regole per non sbilanciare il punteggio (vedi `score.ts`): una sola opzione `correct` per fase;
 * 3 opzioni nelle prime quattro fasi, 4 nell'ultima; l'id `-a` è sempre la risposta giusta
 * (l'ordine a schermo viene comunque mescolato da `state/red.ts`).
 */

/** false: le fasi hanno contenuti reali (nessun avviso "da completare" nel terminale). */
export const PLACEHOLDER = false

export interface AttackOption {
  id: string
  /** command = riga da terminale (monospace), answer = risposta a parole. */
  kind: 'command' | 'answer'
  label: string
  correct: boolean
  /** Righe di output mostrate nel terminale dopo la scelta. */
  output: string[]
  /** Perché è giusta o sbagliata. */
  explanation: string
}

export interface AttackStep {
  id: string
  /** Tattica MITRE ATT&CK. */
  tactic: string
  /** Tecnica MITRE ATT&CK; assente nelle fasi di sola analisi. */
  technique?: { id: string; name: string }
  title: string
  question: string
  /** Punti in palio. */
  points: number
  options: AttackOption[]
}

export const STEPS: AttackStep[] = [
  {
    id: 'fase-1',
    tactic: 'Discovery',
    technique: { id: 'T1016', name: 'System Network Configuration Discovery' },
    title: 'Dove sono',
    question: 'Sei appena connesso al Wi-Fi ospiti. Qual è il primo passo per capire in che rete ti trovi e se ne esistono altre?',
    points: 150,
    options: [
      {
        id: 'fase-1-a',
        kind: 'command',
        label: 'ip addr show && ip route && cat /etc/resolv.conf',
        correct: true,
        output: [
          'inet 192.168.50.23/24 brd 192.168.50.255 scope global wlan0',
          'default via 192.168.50.1 dev wlan0',
          'nameserver 10.0.2.53',
        ],
        explanation:
          'La configurazione locale rivela il tuo indirizzo (rete ospiti), il gateway 192.168.50.1 e un DNS su 10.0.2.53: esiste una rete server 10.0.2.0/24 separata da sondare.',
      },
      {
        id: 'fase-1-b',
        kind: 'command',
        label: 'nmap -p- -T4 192.168.50.1',
        correct: false,
        output: ['Starting Nmap... scanning 192.168.50.1', '65535 ports scanned'],
        explanation:
          'Salti la ricognizione di base: stai già martellando il gateway senza sapere dove sei né quali altre reti esistano.',
      },
      {
        id: 'fase-1-c',
        kind: 'command',
        label: 'sudo tcpdump -i any -n',
        correct: false,
        output: ['listening on any, link-type LINUX_SLL', '... 10.0.0.0 flows ...'],
        explanation:
          'Rumoroso e prematuro: prima leggi la tua configurazione, è immediato e silenzioso.',
      },
    ],
  },
  {
    id: 'fase-2',
    tactic: 'Discovery',
    technique: { id: 'T1018', name: 'Remote System Discovery' },
    title: 'Host raggiungibili',
    question: 'Sai che esiste la rete 10.0.2.0/24. Come individui quali host sono raggiungibili da qui?',
    points: 150,
    options: [
      {
        id: 'fase-2-a',
        kind: 'command',
        label: 'nmap -sn 10.0.2.0/24',
        correct: true,
        output: [
          'Nmap scan report for 10.0.2.11',
          'Host is up (0.0019s latency).',
          'Nmap done: 256 IP addresses (1 host up)',
        ],
        explanation:
          'Il ping sweep trova gli host vivi: da qui raggiungi solo 10.0.2.11, perché il firewall ti ci lascia arrivare mentre il resto del segmento è bloccato. È già un’anomalia.',
      },
      {
        id: 'fase-2-b',
        kind: 'command',
        label: 'nmap -sn 192.168.50.0/24',
        correct: false,
        output: ['Nmap scan report for 192.168.50.0/24', '12 hosts up (altri dispositivi ospiti)'],
        explanation:
          'Scansioni la tua stessa rete ospiti: trovi altri client, non il segmento server dove sta il bersaglio.',
      },
      {
        id: 'fase-2-c',
        kind: 'command',
        label: 'traceroute 8.8.8.8',
        correct: false,
        output: ['1  192.168.50.1  1.1 ms', '2  203.0.113.1  8.4 ms', '...'],
        explanation:
          'La navigazione ospiti verso Internet è permessa, ma non ti dice nulla sugli host interni.',
      },
    ],
  },
  {
    id: 'fase-3',
    tactic: 'Discovery',
    technique: { id: 'T1046', name: 'Network Service Discovery' },
    title: 'Servizi esposti',
    question: '10.0.2.11 risponde. Quali servizi espone?',
    points: 200,
    options: [
      {
        id: 'fase-3-a',
        kind: 'command',
        label: 'nmap -sV -Pn 10.0.2.11',
        correct: true,
        output: [
          'PORT     STATE    SERVICE        VERSION',
          '22/tcp   filtered ssh',
          '445/tcp  filtered microsoft-ds',
          '3389/tcp open     ms-wbt-server  Microsoft Terminal Services',
        ],
        explanation:
          'La scansione dei servizi trova il Desktop remoto (RDP) aperto verso un ospite: è esattamente il servizio che non dovrebbe essere raggiungibile dalla rete ospiti.',
      },
      {
        id: 'fase-3-b',
        kind: 'command',
        label: 'ping -c 4 10.0.2.11',
        correct: false,
        output: ['64 bytes from 10.0.2.11: icmp_seq=1 ttl=63 time=1.9 ms', '4 packets transmitted, 4 received'],
        explanation:
          'Conferma solo che l’host è vivo (lo sapevi già): non rivela quali porte o servizi sono aperti.',
      },
      {
        id: 'fase-3-c',
        kind: 'command',
        label: 'nslookup srv-01 10.0.2.53',
        correct: false,
        output: ['Server:  10.0.2.53', 'Name:    srv-01', 'Address: 10.0.2.11'],
        explanation:
          'Risolve il nome in indirizzo, ma non enumera i servizi: non sai ancora cosa gira su quell’host.',
      },
    ],
  },
  {
    id: 'fase-4',
    tactic: 'Analisi',
    title: 'La causa',
    question: 'Un ospite raggiunge l’RDP di un server privato. Qual è la causa che rende possibile l’attacco?',
    points: 200,
    options: [
      {
        id: 'fase-4-a',
        kind: 'answer',
        label: 'Una regola del firewall troppo permissiva (permit any → srv-01) lascia passare qualsiasi servizio dalla rete ospiti.',
        correct: true,
        output: [],
        explanation:
          'Esatto: è la regola R4 "temporanea" che il blue team trova nella console. La rete ospiti dovrebbe poter raggiungere solo Internet, non i server.',
      },
      {
        id: 'fase-4-b',
        kind: 'answer',
        label: 'Il server srv-01 ha una password di amministratore debole.',
        correct: false,
        output: [],
        explanation:
          'Una password debole è un problema a valle: qui il difetto è che un ospite può perfino raggiungere la porta RDP del server.',
      },
      {
        id: 'fase-4-c',
        kind: 'answer',
        label: 'Il Wi-Fi ospiti non è cifrato.',
        correct: false,
        output: [],
        explanation:
          'Riguarda la rete wireless, non il motivo per cui il traffico attraversa il firewall fino al segmento server.',
      },
    ],
  },
  {
    id: 'fase-5',
    tactic: 'Lateral Movement',
    technique: { id: 'T1021.001', name: 'Remote Services: Remote Desktop Protocol' },
    title: 'Accesso al server',
    question: 'Hai trovato l’RDP aperto e capito la falla. Quale comando sfrutta la vulnerabilità aprendo la sessione di Desktop remoto su srv-01?',
    points: 300,
    options: [
      {
        id: 'fase-5-a',
        kind: 'command',
        label: 'xfreerdp /v:10.0.2.11 /u:Administrator',
        correct: true,
        output: ['[INFO] connecting to 10.0.2.11:3389', '[INFO] negotiation successful', 'Sessione Desktop remoto aperta su srv-01.'],
        explanation:
          'È la tecnica T1021.001: usa il servizio RDP esposto per ottenere una sessione interattiva sul server. È la connessione ospite → srv-01:3389 che il blue team vede scattare su Splunk.',
      },
      {
        id: 'fase-5-b',
        kind: 'command',
        label: 'ssh Administrator@10.0.2.11',
        correct: false,
        output: ['ssh: connect to host 10.0.2.11 port 22: Connection refused'],
        explanation:
          'Su srv-01 la porta 22 non è in ascolto (l’nmap mostrava solo la 3389): SSH non è la via d’accesso.',
      },
      {
        id: 'fase-5-c',
        kind: 'command',
        label: 'telnet 10.0.2.11 3389',
        correct: false,
        output: ['Trying 10.0.2.11...', 'Connected to 10.0.2.11.', '????? (dati binari illeggibili)'],
        explanation:
          'Verifica solo che la porta è aperta: telnet non parla il protocollo RDP, quindi nessuna sessione utilizzabile.',
      },
      {
        id: 'fase-5-d',
        kind: 'command',
        label: 'nmap --script rdp-enum-encryption 10.0.2.11',
        correct: false,
        output: ['| rdp-enum-encryption:', '|   Security layer: CredSSP', '|_  RDP Encryption level: High'],
        explanation:
          'È ancora ricognizione sul servizio RDP (livello di cifratura), non l’accesso vero e proprio.',
      },
    ],
  },
]

export const MAX_SCORE = STEPS.reduce((sum, s) => sum + s.points, 0)
