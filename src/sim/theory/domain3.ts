import type { Lesson } from './types'

/** Dominio 3 – Architettura di sicurezza. Tappa 1: solo 3.2 (contiene la teoria dello scenario del firewall). */

const L3_2: Lesson = {
  objective: '3.2',
  title: 'Infrastruttura aziendale sicura',
  summary: 'Zone di rete, firewall e policy, porte e servizi, accesso remoto sicuro.',
  scenario: true,
  essentials: [
    {
      type: 'p',
      text: 'Proteggere l’infrastruttura significa decidere dove mettere i dispositivi, quali reti possono parlarsi e con quali servizi. Lo strumento principale è il firewall: sta al confine tra due zone e confronta ogni connessione con una lista di regole (policy o ACL) [1].',
    },
    {
      type: 'list',
      items: [
        'Ogni regola ha un’azione (permit o deny), una sorgente, una destinazione e un servizio (protocollo e porta).',
        'Le regole si leggono dall’alto verso il basso e vince la prima che corrisponde (first match).',
        'In fondo c’è una regola di default, di solito “deny any any”: quello che non è esplicitamente permesso è bloccato.',
        'Le reti si dividono in zone (uffici, ospiti, server, DMZ) e tra una zona e l’altra passa solo il traffico necessario.',
      ],
    },
    {
      type: 'scenario',
      text: 'Nel firewall fw-01 la regola temporanea R4 (permit any → srv-01 any) sta sopra la policy di default e lascia passare chiunque verso srv-01, anche la Wi-Fi ospiti. Una regola di blocco funziona solo se sta sopra R4.',
    },
  ],
  deep: [
    {
      title: 'Zone di sicurezza e indirizzi',
      blocks: [
        {
          type: 'p',
          text: 'Una zona di sicurezza raggruppa dispositivi con lo stesso livello di fiducia e le stesse esigenze. Le reti interne usano indirizzi privati, riservati dall’RFC 1918 e non instradati su Internet [2].',
        },
        {
          type: 'table',
          head: ['Blocco privato', 'Notazione CIDR', 'Esempio d’uso'],
          rows: [
            ['10.0.0.0 – 10.255.255.255', '10.0.0.0/8', 'LAN uffici 10.0.1.0/24'],
            ['172.16.0.0 – 172.31.255.255', '172.16.0.0/12', 'Reti di laboratorio o data center'],
            ['192.168.0.0 – 192.168.255.255', '192.168.0.0/16', 'Wi-Fi ospiti 192.168.50.0/24'],
          ],
        },
        {
          type: 'p',
          text: 'Il numero dopo la barra indica quanti bit identificano la rete: un /24 lascia 8 bit agli host, cioè 254 indirizzi utilizzabili. Tutti gli IP che iniziano con 192.168.50. appartengono alla stessa rete /24.',
        },
        {
          type: 'p',
          text: 'La DMZ (zona demilitarizzata) è una rete separata per i servizi che devono essere raggiungibili da Internet, come un sito web: se vengono compromessi, l’attaccante non si trova già dentro la LAN [7]. La rete ospiti segue la stessa logica al contrario: deve raggiungere Internet ma non le risorse interne.',
        },
      ],
    },
    {
      title: 'Firewall: tipi e scrittura delle regole',
      blocks: [
        {
          type: 'table',
          head: ['Tipo', 'Cosa guarda', 'Note'],
          rows: [
            ['Packet filter (stateless)', 'Indirizzi, protocollo e porte di ogni pacchetto', 'Semplice e veloce, non ricorda le connessioni'],
            ['Stateful', 'Anche lo stato della connessione', 'Lascia rientrare le risposte senza regole aggiuntive'],
            ['Next-generation (NGFW)', 'Anche applicazione e utente (livello 7)', 'Spesso integra IPS e filtro URL'],
            ['Web application firewall (WAF)', 'Le richieste HTTP verso un’applicazione', 'Protegge da attacchi web come SQL injection'],
          ],
        },
        {
          type: 'p',
          text: 'Le linee guida NIST suggeriscono di partire da una policy “deny by default” e di aggiungere solo le eccezioni giustificate, documentando chi ha chiesto ogni regola e perché [1]. Le regole specifiche vanno sopra quelle generiche, altrimenti una regola larga “mette in ombra” quelle sotto di lei.',
        },
        {
          type: 'example',
          title: 'Una connessione attraversa la lista (first match)',
          lines: [
            'Connessione: 192.168.50.23 → srv-01 tcp/3389',
            'R1 permit 10.0.1.0/24 → server tcp/22,3389   ✗ sorgente diversa',
            'R2 permit 10.0.1.0/24 → Internet tcp/80,443  ✗',
            'R3 permit 192.168.50.0/24 → Internet         ✗ destinazione diversa',
            'R4 permit any → srv-01 any                   ✓ PERMIT, fine valutazione',
          ],
        },
        {
          type: 'list',
          items: [
            'Rivedi periodicamente le regole: contatori di hit a zero o regole “temporanee” scadute sono candidati alla rimozione.',
            'Evita “any” su servizio e sorgente quando non serve: ogni “any” allarga la superficie di attacco.',
            'Registra nei log almeno le connessioni bloccate e quelle verso i servizi critici: servono al SOC per le indagini.',
          ],
        },
      ],
    },
    {
      title: 'Porte, servizi e superficie di attacco',
      blocks: [
        {
          type: 'p',
          text: 'Ogni servizio ascolta su una porta TCP o UDP; i numeri ufficiali sono assegnati da IANA [3]. La superficie di attacco è l’insieme dei servizi raggiungibili da chi non dovrebbe usarli: ridurla è una delle misure più efficaci.',
        },
        {
          type: 'table',
          head: ['Porta', 'Servizio', 'Rischio se esposto'],
          rows: [
            ['tcp/22', 'SSH', 'Tentativi di accesso e brute force sulle credenziali'],
            ['udp/53', 'DNS', 'Abusi per amplificazione o esfiltrazione se aperto a tutti'],
            ['tcp/80, tcp/443', 'HTTP / HTTPS', 'Vulnerabilità delle applicazioni web'],
            ['tcp/445', 'SMB', 'Diffusione di malware e ransomware tra macchine'],
            ['tcp/3389', 'RDP', 'Accesso grafico remoto: molto usato dagli attaccanti'],
          ],
        },
        {
          type: 'p',
          text: 'MITRE ATT&CK documenta l’uso del Desktop remoto come tecnica di movimento laterale: con credenziali valide, l’attaccante ottiene una sessione grafica completa sul server [4]. Per questo i servizi di amministrazione vanno resi raggiungibili solo dalle reti degli amministratori.',
        },
      ],
    },
    {
      title: 'Accesso remoto sicuro e zero trust',
      blocks: [
        {
          type: 'list',
          items: [
            'VPN (IPsec o TLS): crea un tunnel cifrato tra l’utente remoto e la rete aziendale; va protetta con MFA.',
            'Jump server (bastion host): un’unica macchina controllata e monitorata da cui gli amministratori accedono ai server.',
            'Zero trust: nessuna rete è considerata fidata di per sé; ogni accesso viene verificato per identità, dispositivo e contesto [5].',
            'SD-WAN e SASE: collegano sedi e utenti remoti applicando le policy di sicurezza in modo centralizzato, spesso dal cloud.',
          ],
        },
        {
          type: 'p',
          text: 'Nel modello zero trust la domanda non è “sei dentro la rete?” ma “sei tu, da un dispositivo sano, e ti serve davvero questa risorsa adesso?” [5].',
        },
      ],
    },
    {
      title: 'Altri apparati e modalità di guasto',
      blocks: [
        {
          type: 'list',
          items: [
            'IDS e IPS: l’IDS osserva e segnala, l’IPS sta in linea e può bloccare (vedi obiettivo 4.5).',
            'Proxy e filtri web: intermediari che controllano le connessioni degli utenti verso Internet.',
            'Bilanciatori di carico: distribuiscono il traffico tra più server e aumentano la disponibilità.',
            'Port security e 802.1X: sugli switch, permettono di collegarsi solo ai dispositivi autorizzati.',
          ],
        },
        {
          type: 'p',
          text: 'Un apparato in linea può guastarsi in due modi: fail-open (lascia passare tutto, privilegia la disponibilità) o fail-closed (blocca tutto, privilegia la sicurezza). La scelta dipende da cosa costa di più all’azienda [8].',
        },
      ],
    },
  ],
  sources: [
    { title: 'SP 800-41 Rev. 1 – Guidelines on Firewalls and Firewall Policy', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/41/r1/final', lang: 'EN' },
    { title: 'RFC 1918 – Address Allocation for Private Internets', publisher: 'IETF / RFC Editor', url: 'https://www.rfc-editor.org/info/rfc1918/', lang: 'EN' },
    { title: 'Service Name and Transport Protocol Port Number Registry', publisher: 'IANA', url: 'https://www.iana.org/assignments/service-names-port-numbers', lang: 'EN' },
    { title: 'T1021.001 – Remote Services: Remote Desktop Protocol', publisher: 'MITRE ATT&CK', url: 'https://attack.mitre.org/techniques/T1021/001/', lang: 'EN' },
    { title: 'SP 800-207 – Zero Trust Architecture', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/207/final', lang: 'EN' },
    { title: 'Firewall', publisher: 'Wikipedia', url: 'https://it.wikipedia.org/wiki/Firewall', lang: 'IT' },
    { title: 'Zona demilitarizzata', publisher: 'Wikipedia', url: 'https://it.wikipedia.org/wiki/Zona_demilitarizzata', lang: 'IT' },
    { title: 'Network Defense (corso)', publisher: 'Cisco Networking Academy', url: 'https://www.netacad.com/courses/network-defense', lang: 'EN' },
  ],
}

export const DOMAIN3_LESSONS: Lesson[] = [L3_2]
