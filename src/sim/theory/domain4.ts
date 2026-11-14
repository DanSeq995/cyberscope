import type { Lesson, Source } from './types'

/** Dominio 4 – Operazioni di sicurezza (28% dell'esame). Tappa 1: completo. */

const S = {
  nist80092: { title: 'SP 800-92 – Guide to Computer Security Log Management', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/92/final', lang: 'EN' },
  splunkTutorial: { title: 'Search Tutorial', publisher: 'Splunk Docs', url: 'https://help.splunk.com/en/splunk-enterprise/get-started/search-tutorial', lang: 'EN' },
  splunkSpl: { title: 'Search Reference (SPL)', publisher: 'Splunk Docs', url: 'https://help.splunk.com/en/splunk-enterprise/search/spl-search-reference', lang: 'EN' },
  splunkHec: {
    title: 'Set up and use HTTP Event Collector',
    publisher: 'Splunk Docs',
    url: 'https://help.splunk.com/en/splunk-enterprise/get-data-in/get-started-with-getting-data-in/9.4/get-data-with-http-event-collector/set-up-and-use-http-event-collector-in-splunk-web',
    lang: 'EN',
  },
  splunkSiem: { title: 'What is SIEM?', publisher: 'Splunk', url: 'https://www.splunk.com/en_us/blog/learn/siem-security-information-event-management.html', lang: 'EN' },
  wikiSiem: { title: 'Security Information and Event Management', publisher: 'Wikipedia', url: 'https://it.wikipedia.org/wiki/Security_Information_and_Event_Management', lang: 'IT' },
  attack: { title: 'MITRE ATT&CK – matrice delle tecniche', publisher: 'MITRE', url: 'https://attack.mitre.org/', lang: 'EN' },
  ipfix: { title: 'RFC 7011 – IP Flow Information Export (IPFIX)', publisher: 'IETF / RFC Editor', url: 'https://www.rfc-editor.org/info/rfc7011/', lang: 'EN' },
} satisfies Record<string, Source>

const L4_1: Lesson = {
  objective: '4.1',
  title: 'Sicurezza delle risorse di calcolo',
  summary: 'Baseline sicure, hardening, dispositivi mobili, wireless e applicazioni.',
  essentials: [
    {
      type: 'p',
      text: 'Ogni computer, server, smartphone o apparato di rete nasce con impostazioni pensate per funzionare subito, non per essere sicuro. Il lavoro del blue team è portarli a una configurazione di riferimento (baseline) e mantenerli lì nel tempo [1].',
    },
    {
      type: 'list',
      items: [
        'Stabilire la baseline: partire da guide riconosciute, come i CIS Benchmarks, adattate all’azienda [1].',
        'Distribuirla: applicarla in modo automatico (criteri di gruppo, strumenti di gestione delle configurazioni).',
        'Mantenerla: controllare periodicamente che nessuno l’abbia modificata e aggiornarla quando cambiano le minacce.',
      ],
    },
  ],
  deep: [
    {
      title: 'Hardening: ridurre il superfluo',
      blocks: [
        {
          type: 'p',
          text: 'Hardening significa togliere tutto ciò che non serve e proteggere ciò che resta: servizi disattivati, account di default rimossi, password cambiate, aggiornamenti installati, log attivi [2].',
        },
        {
          type: 'table',
          head: ['Risorsa', 'Interventi tipici'],
          rows: [
            ['Workstation', 'Antimalware/EDR, cifratura del disco, utenti senza privilegi di amministratore'],
            ['Server', 'Solo i ruoli necessari, accesso amministrativo da reti dedicate, log centralizzati [2]'],
            ['Switch e router', 'Gestione via SSH (mai Telnet), password di default cambiate, porte inutilizzate disattivate'],
            ['Cloud', 'Permessi minimi, niente risorse pubbliche per errore, chiavi gestite in modo sicuro'],
            ['IoT, ICS, sistemi embedded', 'Reti separate, firmware aggiornato, nessun accesso diretto da Internet'],
          ],
        },
      ],
    },
    {
      title: 'Dispositivi mobili',
      blocks: [
        {
          type: 'p',
          text: 'Smartphone e tablet escono dall’ufficio: si perdono, si collegano a reti sconosciute, mescolano dati personali e aziendali. Le linee guida NIST raccomandano una gestione centralizzata con criteri chiari [4].',
        },
        {
          type: 'list',
          items: [
            'MDM (Mobile Device Management): impone PIN, cifratura, aggiornamenti e permette la cancellazione da remoto.',
            'BYOD: il dipendente usa il proprio dispositivo; COPE: il dispositivo è aziendale ma con uso personale consentito; CYOD: il dipendente sceglie da un elenco approvato.',
            'Connessioni: Bluetooth, NFC e hotspot vanno limitati quando non servono.',
          ],
        },
      ],
    },
    {
      title: 'Reti wireless',
      blocks: [
        {
          type: 'p',
          text: 'Il Wi-Fi attraversa i muri: chiunque nel parcheggio può provare a collegarsi. Lo standard attuale è WPA3, che protegge meglio le password deboli e la riservatezza del traffico [6].',
        },
        {
          type: 'list',
          items: [
            'Personal (chiave condivisa): adatto a reti piccole o ospiti, con password lunga.',
            'Enterprise (802.1X con server RADIUS): ogni utente ha le proprie credenziali; si revoca un accesso senza cambiare la chiave a tutti [3].',
            'Site survey e heat map: misurare la copertura per non “regalare” segnale fuori dall’edificio e scoprire access point non autorizzati.',
          ],
        },
        {
          type: 'scenario',
          text: 'La Wi-Fi ospiti dell’ufficio è una rete wireless separata (192.168.50.0/24): proprio perché è aperta a persone esterne, non deve poter raggiungere i server.',
        },
      ],
    },
    {
      title: 'Sicurezza delle applicazioni e sandboxing',
      blocks: [
        {
          type: 'list',
          items: [
            'Validazione dell’input: mai fidarsi dei dati inseriti dagli utenti (è la causa di molte voci della OWASP Top 10) [5].',
            'Cookie sicuri: attributi Secure e HttpOnly per proteggere le sessioni.',
            'Firma del codice: garantisce chi ha prodotto il software e che non è stato modificato.',
            'Analisi statica: strumenti che cercano difetti nel codice prima che venga eseguito.',
            'Sandboxing: eseguire programmi o allegati sospetti in un ambiente isolato, da cui non possono toccare il sistema reale.',
          ],
        },
        {
          type: 'p',
          text: 'Infine il monitoraggio: una baseline senza controlli si degrada. Agent e scansioni periodiche verificano che le configurazioni restino conformi [7].',
        },
      ],
    },
  ],
  sources: [
    { title: 'CIS Benchmarks', publisher: 'Center for Internet Security', url: 'https://www.cisecurity.org/cis-benchmarks', lang: 'EN' },
    { title: 'SP 800-123 – Guide to General Server Security', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/123/final', lang: 'EN' },
    { title: 'SP 800-153 – Guidelines for Securing Wireless Local Area Networks', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/153/final', lang: 'EN' },
    { title: 'SP 800-124 Rev. 2 – Guidelines for Managing the Security of Mobile Devices', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/124/r2/final', lang: 'EN' },
    { title: 'OWASP Top 10', publisher: 'OWASP Foundation', url: 'https://owasp.org/www-project-top-ten/', lang: 'EN' },
    { title: 'Wi-Fi Security (WPA3)', publisher: 'Wi-Fi Alliance', url: 'https://www.wi-fi.org/security', lang: 'EN' },
    { title: 'Endpoint Security (corso)', publisher: 'Cisco Networking Academy', url: 'https://www.netacad.com/courses/endpoint-security', lang: 'EN' },
  ],
}

const L4_2: Lesson = {
  objective: '4.2',
  title: 'Gestione degli asset',
  summary: 'Non puoi proteggere ciò che non sai di avere: dall’acquisto alla dismissione.',
  essentials: [
    {
      type: 'p',
      text: 'Un asset è qualsiasi risorsa di valore: hardware, software, dati, servizi cloud. I primi controlli dei CIS Controls riguardano proprio l’inventario di hardware e software: senza un elenco aggiornato non si sa cosa aggiornare, monitorare o difendere [1].',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Acquisizione: si compra da fornitori affidabili, verificando requisiti di sicurezza e supporto.',
        'Assegnazione: ogni asset ha un proprietario responsabile e una classificazione.',
        'Monitoraggio: inventario sempre aggiornato, con la scoperta automatica dei dispositivi nuovi.',
        'Dismissione: i dati vengono cancellati in modo sicuro prima che l’asset lasci l’azienda.',
      ],
    },
  ],
  deep: [
    {
      title: 'Proprietà e classificazione',
      blocks: [
        {
          type: 'p',
          text: 'Il proprietario dell’asset decide chi può usarlo e quanto è critico; la classificazione (es. pubblico, interno, riservato) guida le protezioni da applicare. Un server che contiene dati personali richiede controlli diversi da un PC per le presentazioni.',
        },
      ],
    },
    {
      title: 'Inventario e scoperta',
      blocks: [
        {
          type: 'p',
          text: 'Gli inventari compilati a mano invecchiano in fretta. Le soluzioni di IT asset management combinano scansioni di rete, agent sui dispositivi e dati degli acquisti per avere un quadro affidabile [2].',
        },
        {
          type: 'list',
          items: [
            'Dispositivi non autorizzati (shadow IT) vanno individuati e isolati o regolarizzati.',
            'Il software non più supportato dal produttore non riceve patch: va sostituito o compensato.',
            'Le misure minime AgID per la PA italiana partono anch’esse dall’inventario dei dispositivi e del software [4].',
          ],
        },
      ],
    },
    {
      title: 'Dismissione sicura',
      blocks: [
        {
          type: 'p',
          text: 'Formattare un disco non basta: i dati spesso restano recuperabili. NIST SP 800-88 distingue tre livelli di sanificazione dei supporti [3].',
        },
        {
          type: 'table',
          head: ['Livello', 'Cosa fa', 'Quando'],
          rows: [
            ['Clear', 'Sovrascrittura logica dei dati', 'Il supporto resta in azienda'],
            ['Purge', 'Tecniche che resistono anche a recuperi di laboratorio (es. cancellazione crittografica)', 'Il supporto esce dall’azienda'],
            ['Destroy', 'Distruzione fisica (triturazione, incenerimento)', 'Dati molto sensibili o supporti guasti'],
          ],
        },
        {
          type: 'p',
          text: 'Alla fine si conserva un certificato di distruzione o sanificazione, e si rispettano i tempi di conservazione previsti per i dati (data retention).',
        },
      ],
    },
  ],
  sources: [
    { title: 'CIS Critical Security Controls – elenco', publisher: 'Center for Internet Security', url: 'https://www.cisecurity.org/controls/cis-controls-list', lang: 'EN' },
    { title: 'SP 1800-5 – IT Asset Management', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/1800/5/final', lang: 'EN' },
    { title: 'SP 800-88 Rev. 1 – Guidelines for Media Sanitization', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/88/r1/final', lang: 'EN' },
    { title: 'Misure minime di sicurezza ICT per le PA', publisher: 'AgID', url: 'https://www.agid.gov.it/it/sicurezza/misure-minime-sicurezza-ict', lang: 'IT' },
  ],
}

const L4_3: Lesson = {
  objective: '4.3',
  title: 'Gestione delle vulnerabilità',
  summary: 'Trovare, valutare, correggere e verificare le debolezze, in ordine di rischio.',
  essentials: [
    {
      type: 'p',
      text: 'Una vulnerabilità è una debolezza che un attaccante può sfruttare. Le vulnerabilità note ricevono un identificativo CVE (es. CVE-2024-12345), che permette a tutti di riferirsi allo stesso problema [1].',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Identificare: scansioni, analisi del codice, feed di threat intelligence, penetration test, bug bounty.',
        'Analizzare: confermare (escludendo i falsi positivi) e assegnare una priorità.',
        'Rispondere: applicare la patch o, se non è possibile, un controllo compensativo.',
        'Validare: riscansionare per verificare che il problema sia davvero risolto.',
        'Riportare: documentare cosa è stato trovato, cosa è stato fatto e cosa resta aperto.',
      ],
    },
  ],
  deep: [
    {
      title: 'Dove si trovano le vulnerabilità',
      blocks: [
        {
          type: 'list',
          items: [
            'Scanner di vulnerabilità: confrontano versioni e configurazioni con database come l’NVD [2]; autenticati vedono molto di più.',
            'Analisi delle applicazioni: statica (codice) e dinamica (applicazione in esecuzione); controllo delle librerie di terze parti.',
            'Threat feed: fonti aperte (OSINT), commerciali, ISAC di settore; in Italia gli avvisi di CSIRT Italia [7].',
            'Penetration test e bug bounty: persone che provano davvero ad attaccare, con regole concordate.',
          ],
        },
      ],
    },
    {
      title: 'Dare una priorità: CVSS, KEV, EPSS',
      blocks: [
        {
          type: 'p',
          text: 'Il CVSS assegna un punteggio da 0 a 10 alla gravità tecnica di una vulnerabilità [3]. Il vettore descrive come si sfrutta.',
        },
        {
          type: 'example',
          title: 'Leggere un vettore CVSS 3.1',
          lines: [
            'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H  → 9.8 Critica',
            'AV:N   sfruttabile dalla rete',
            'AC:L   bassa complessità',
            'PR:N   nessun privilegio richiesto',
            'UI:N   nessuna azione dell’utente',
            'C/I/A:H  impatto alto su riservatezza, integrità, disponibilità',
          ],
        },
        {
          type: 'table',
          head: ['Punteggio', 'Gravità'],
          rows: [
            ['0.1 – 3.9', 'Bassa'],
            ['4.0 – 6.9', 'Media'],
            ['7.0 – 8.9', 'Alta'],
            ['9.0 – 10.0', 'Critica'],
          ],
        },
        {
          type: 'p',
          text: 'Il punteggio da solo non basta: conta il contesto (il sistema è esposto? contiene dati critici?). Il catalogo KEV di CISA elenca le vulnerabilità già sfruttate negli attacchi reali [4], mentre l’EPSS stima la probabilità che una vulnerabilità venga sfruttata nei prossimi 30 giorni [5]. La versione più recente dello standard è CVSS 4.0 [3].',
        },
      ],
    },
    {
      title: 'Rispondere e chiudere il ciclo',
      blocks: [
        {
          type: 'list',
          items: [
            'Patch: la soluzione preferita, pianificata e testata secondo un processo di patch management [6].',
            'Segmentazione o controlli compensativi: se la patch non c’è, si riduce chi può raggiungere il sistema vulnerabile.',
            'Eccezioni: accettare il rischio in modo formale, con scadenza e responsabile.',
            'Assicurazione: trasferire parte del rischio economico (non elimina il problema tecnico).',
            'Validazione: nuova scansione, audit o verifica manuale prima di chiudere il ticket.',
          ],
        },
        {
          type: 'scenario',
          text: 'La regola R4 del firewall è una debolezza di configurazione, non un difetto del software: non ha un CVE, ma va gestita con lo stesso ciclo (trovata, valutata, corretta, verificata con un nuovo test).',
        },
      ],
    },
  ],
  sources: [
    { title: 'CVE Program', publisher: 'MITRE / CVE', url: 'https://www.cve.org/', lang: 'EN' },
    { title: 'National Vulnerability Database (NVD)', publisher: 'NIST', url: 'https://nvd.nist.gov/', lang: 'EN' },
    { title: 'Common Vulnerability Scoring System (CVSS)', publisher: 'FIRST', url: 'https://www.first.org/cvss/', lang: 'EN' },
    { title: 'Known Exploited Vulnerabilities Catalog', publisher: 'CISA', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', lang: 'EN' },
    { title: 'Exploit Prediction Scoring System (EPSS)', publisher: 'FIRST', url: 'https://www.first.org/epss/', lang: 'EN' },
    { title: 'SP 800-40 Rev. 4 – Guide to Enterprise Patch Management Planning', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/40/r4/final', lang: 'EN' },
    { title: 'CSIRT Italia', publisher: 'Agenzia per la Cybersicurezza Nazionale', url: 'https://www.acn.gov.it/portale/csirt-italia/', lang: 'IT' },
    { title: 'Common Vulnerabilities and Exposures', publisher: 'Wikipedia', url: 'https://it.wikipedia.org/wiki/Common_Vulnerabilities_and_Exposures', lang: 'IT' },
  ],
}

const L4_4: Lesson = {
  objective: '4.4',
  title: 'Alerting e monitoraggio',
  summary: 'Log, SIEM, correlation search e alert: come il SOC si accorge dei problemi.',
  scenario: true,
  essentials: [
    {
      type: 'p',
      text: 'Firewall, server e applicazioni producono continuamente log, righe che descrivono cosa è successo. Un SIEM (Security Information and Event Management) li raccoglie in un unico posto, li normalizza e li correla per far emergere ciò che è sospetto [1][5].',
    },
    {
      type: 'list',
      items: [
        'Aggregazione: i log arrivano da tante sorgenti (agent, syslog, API come l’HTTP Event Collector di Splunk) [4].',
        'Correlazione: ricerche salvate collegano eventi diversi e generano un alert quando trovano uno schema sospetto.',
        'Risposta: l’analista valuta l’alert, lo conferma o lo scarta, e avvia le azioni necessarie.',
        'Archiviazione: i log vanno conservati per il tempo necessario a indagini e obblighi normativi [1].',
      ],
    },
    {
      type: 'scenario',
      text: 'Nel gioco il firewall invia gli eventi via HEC al finto Splunk; la correlation search “Servizio interno esposto alla rete ospiti” trova una connessione dalla rete 192.168.50.0/24 verso la porta 3389 di srv-01 e apre l’alert sul video wall.',
    },
  ],
  deep: [
    {
      title: 'Dentro Splunk: eventi, index e campi',
      blocks: [
        {
          type: 'table',
          head: ['Concetto', 'Significato'],
          rows: [
            ['Evento', 'Una singola riga di log, con il suo orario (_time)'],
            ['Index', 'Il contenitore in cui sono salvati gli eventi (es. index=security)'],
            ['Sourcetype', 'Il formato della sorgente (es. firewall, linux_secure, dns)'],
            ['Campi', 'Informazioni estratte: src_ip, dest, dest_port, action, rule…'],
          ],
        },
        {
          type: 'p',
          text: 'Le ricerche si scrivono in SPL (Search Processing Language): prima si filtrano gli eventi, poi con la barra | si passano ai comandi successivi, come in una catena di montaggio [2][3].',
        },
        {
          type: 'example',
          title: 'La ricerca dello scenario, riga per riga',
          lines: [
            'index=security sourcetype=firewall action=allowed     ← connessioni lasciate passare',
            'src_ip=192.168.50.0/24 dest=srv-*                      ← dalla rete ospiti verso i server',
            'dest_port IN (22,445,3389)                             ← solo servizi di amministrazione',
            '| stats count BY src_ip, dest, dest_port, rule         ← conta e raggruppa',
          ],
        },
      ],
    },
    {
      title: 'Tuning: falsi positivi e falsi negativi',
      blocks: [
        {
          type: 'table',
          head: ['Esito', 'Cosa succede', 'Rischio'],
          rows: [
            ['Vero positivo', 'Alert su un evento davvero malevolo', 'Nessuno: è il caso ideale'],
            ['Falso positivo', 'Alert su un evento innocuo', 'Stanchezza da alert: gli analisti iniziano a ignorarli'],
            ['Falso negativo', 'Nessun alert su un evento malevolo', 'L’attacco passa inosservato'],
            ['Vero negativo', 'Nessun alert su attività normale', 'Nessuno'],
          ],
        },
        {
          type: 'p',
          text: 'Fare tuning significa regolare soglie, finestre temporali ed eccezioni perché gli alert siano pochi ma significativi. Collegare le regole alle tecniche di MITRE ATT&CK aiuta a capire quali comportamenti si stanno coprendo e quali no [7].',
        },
      ],
    },
    {
      title: 'Altri strumenti di monitoraggio',
      blocks: [
        {
          type: 'list',
          items: [
            'Agent e agentless: un agent installato vede molti dettagli; il monitoraggio agentless interroga i sistemi da remoto.',
            'SNMP e trap: gli apparati di rete segnalano guasti e cambi di stato a un sistema di gestione.',
            'NetFlow / IPFIX: riepiloghi di chi ha parlato con chi, quanto e quando, senza il contenuto dei pacchetti [8].',
            'SCAP e benchmark: controllo automatico della conformità delle configurazioni.',
            'Antivirus, DLP e scanner di vulnerabilità: anch’essi producono alert da far confluire nel SIEM.',
          ],
        },
        {
          type: 'p',
          text: 'Un buon monitoraggio si misura anche nei report: dashboard per il SOC, riepiloghi periodici per la direzione, evidenze per gli audit [6].',
        },
      ],
    },
  ],
  sources: [
    S.nist80092,
    S.splunkTutorial,
    S.splunkSpl,
    S.splunkHec,
    S.splunkSiem,
    S.wikiSiem,
    S.attack,
    S.ipfix,
  ],
}

const L4_5: Lesson = {
  objective: '4.5',
  title: 'Potenziare le difese aziendali',
  summary: 'Firewall, IDS/IPS, filtri web e DNS, email, DLP, NAC, EDR/XDR.',
  essentials: [
    {
      type: 'p',
      text: 'Le difese non sono un unico prodotto ma strati che si coprono a vicenda (difesa in profondità). Saperle modificare in risposta a un problema è una competenza chiave del SOC.',
    },
    {
      type: 'table',
      head: ['Controllo', 'A cosa serve'],
      rows: [
        ['Firewall', 'Decide quali connessioni passano tra le zone di rete (vedi 3.2)'],
        ['IDS / IPS', 'Riconosce attacchi nel traffico; l’IPS può anche bloccarli [1]'],
        ['Filtro web e DNS', 'Impedisce di raggiungere siti malevoli o categorie vietate [3]'],
        ['Sicurezza email', 'SPF, DKIM e DMARC contro lo spoofing del mittente [4][5][6]'],
        ['DLP', 'Impedisce che dati sensibili escano dall’azienda'],
        ['NAC', 'Fa entrare in rete solo dispositivi autorizzati e conformi [7]'],
        ['EDR / XDR', 'Rileva e blocca comportamenti malevoli sugli endpoint e li correla con altre fonti'],
      ],
    },
  ],
  deep: [
    {
      title: 'IDS e IPS',
      blocks: [
        {
          type: 'p',
          text: 'Un IDS osserva una copia del traffico e segnala; un IPS sta in linea e può scartare i pacchetti. Entrambi usano firme (schemi di attacchi noti) e/o rilevamento di anomalie rispetto al comportamento normale [1].',
        },
        {
          type: 'example',
          title: 'Una firma in stile Snort',
          lines: [
            'alert tcp 192.168.50.0/24 any -> $HOME_NET 3389 (msg:"RDP dalla rete ospiti"; sid:1000001; rev:1;)',
            'alert  azione (segnala)        tcp  protocollo',
            '192.168.50.0/24 any  sorgente e porta    ->  direzione',
            '$HOME_NET 3389  destinazione e porta     msg/sid  testo e identificativo della regola',
          ],
        },
        {
          type: 'p',
          text: 'Snort è uno degli IDS/IPS open source più diffusi; le sue regole sono un buon modo per imparare a descrivere il traffico sospetto [2].',
        },
      ],
    },
    {
      title: 'Filtri web e DNS',
      blocks: [
        {
          type: 'list',
          items: [
            'Filtro web con agent sul dispositivo o proxy centralizzato: categorie, reputazione degli URL, blocco dei download pericolosi.',
            'DNS filtering: il resolver si rifiuta di risolvere domini malevoli, bloccando phishing e comunicazioni del malware sul nascere [3].',
          ],
        },
      ],
    },
    {
      title: 'Email: SPF, DKIM, DMARC',
      blocks: [
        {
          type: 'table',
          head: ['Meccanismo', 'Cosa verifica'],
          rows: [
            ['SPF', 'Quali server sono autorizzati a inviare email per un dominio [4]'],
            ['DKIM', 'Una firma crittografica che dimostra che il messaggio non è stato alterato [5]'],
            ['DMARC', 'Cosa fare se SPF/DKIM falliscono (nessuna azione, quarantena, rifiuto) e dove inviare i report [6]'],
          ],
        },
        {
          type: 'p',
          text: 'Un gateway di posta aggiunge antispam, antimalware e sandbox per gli allegati.',
        },
      ],
    },
    {
      title: 'Endpoint, dati e accesso alla rete',
      blocks: [
        {
          type: 'list',
          items: [
            'File integrity monitoring: segnala modifiche a file di sistema o di configurazione.',
            'DLP: riconosce dati sensibili (es. numeri di carta, documenti classificati) e ne blocca l’invio.',
            'NAC con 802.1X: prima di dare accesso alla rete verifica identità e stato del dispositivo [7].',
            'EDR/XDR: registrano processi, connessioni e modifiche sugli endpoint; l’XDR li correla con rete, email e cloud.',
            'User behavior analytics: individua comportamenti anomali degli utenti, come accessi in orari insoliti.',
          ],
        },
        {
          type: 'table',
          head: ['Protocollo insicuro', 'Alternativa sicura'],
          rows: [
            ['Telnet (tcp/23)', 'SSH (tcp/22)'],
            ['HTTP (tcp/80)', 'HTTPS (tcp/443)'],
            ['FTP (tcp/21)', 'SFTP o FTPS'],
            ['SNMP v1/v2c', 'SNMP v3'],
            ['LDAP (tcp/389)', 'LDAPS (tcp/636)'],
          ],
        },
        {
          type: 'scenario',
          text: 'Risolvere l’incidente vuol dire proprio “modificare una capacità aziendale”: aggiungere una regola al firewall nel punto giusto della lista.',
        },
      ],
    },
  ],
  sources: [
    { title: 'SP 800-94 – Guide to Intrusion Detection and Prevention Systems', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/94/final', lang: 'EN' },
    { title: 'Snort – Network Intrusion Detection & Prevention System', publisher: 'Cisco Talos / Snort', url: 'https://www.snort.org/', lang: 'EN' },
    { title: 'Protective Domain Name System (DNS) Resolver', publisher: 'CISA', url: 'https://www.cisa.gov/resources-tools/services/protective-domain-name-system-dns-resolver', lang: 'EN' },
    { title: 'RFC 7208 – Sender Policy Framework (SPF)', publisher: 'IETF / RFC Editor', url: 'https://www.rfc-editor.org/info/rfc7208/', lang: 'EN' },
    { title: 'RFC 6376 – DomainKeys Identified Mail (DKIM)', publisher: 'IETF / RFC Editor', url: 'https://www.rfc-editor.org/info/rfc6376/', lang: 'EN' },
    { title: 'RFC 7489 – DMARC', publisher: 'IETF / RFC Editor', url: 'https://www.rfc-editor.org/info/rfc7489/', lang: 'EN' },
    { title: '802.1X – Port-Based Network Access Control', publisher: 'IEEE 802.1', url: 'https://1.ieee802.org/security/802-1x/', lang: 'EN' },
  ],
}

const L4_6: Lesson = {
  objective: '4.6',
  title: 'Gestione delle identità e degli accessi',
  summary: 'Chi sei, cosa puoi fare, per quanto tempo: IAM, MFA, SSO e accessi privilegiati.',
  essentials: [
    {
      type: 'p',
      text: 'L’IAM (Identity and Access Management) governa il ciclo di vita delle identità: dalla creazione dell’account alla sua chiusura, passando per i permessi. Distingue tre momenti: identificazione (dico chi sono), autenticazione (lo dimostro) e autorizzazione (cosa mi è permesso).',
    },
    {
      type: 'list',
      items: [
        'Provisioning e deprovisioning: un account si crea quando serve e si chiude subito quando la persona cambia ruolo o lascia l’azienda.',
        'Minimo privilegio: ogni utente ha solo i permessi indispensabili.',
        'MFA: almeno due fattori diversi; è una delle difese più efficaci contro il furto di password [2].',
      ],
    },
  ],
  deep: [
    {
      title: 'Modelli di controllo degli accessi',
      blocks: [
        {
          type: 'table',
          head: ['Modello', 'Chi decide', 'Esempio'],
          rows: [
            ['DAC (discrezionale)', 'Il proprietario della risorsa', 'Condivido una cartella con un collega'],
            ['MAC (obbligatorio)', 'Il sistema, in base a etichette di classificazione', 'Ambienti militari e governativi'],
            ['RBAC (basato sui ruoli)', 'Il ruolo aziendale', '“Analista SOC” può leggere i log, non modificarli'],
            ['Rule-based', 'Regole generali', 'Accesso consentito solo in orario d’ufficio'],
            ['ABAC (attributi)', 'Attributi di utente, risorsa e contesto', 'Medico + reparto + turno attivo → cartella clinica'],
          ],
        },
      ],
    },
    {
      title: 'Autenticazione, password e MFA',
      blocks: [
        {
          type: 'list',
          items: [
            'Fattori: qualcosa che sai (password, PIN), che hai (token, smartphone, chiave di sicurezza), che sei (biometria); a volte si considera anche dove sei.',
            'Le linee guida NIST più recenti privilegiano password lunghe, il controllo contro elenchi di password compromesse e l’uso di password manager, e sconsigliano regole di composizione rigide e cambi periodici forzati [1].',
            'Le chiavi di sicurezza e i metodi resistenti al phishing (es. FIDO2/passkey) sono la forma di MFA più robusta; gli SMS sono la più debole [2].',
            'Passwordless: autenticazione senza password, basata su chiavi crittografiche legate al dispositivo.',
          ],
        },
      ],
    },
    {
      title: 'Federazione e single sign-on',
      blocks: [
        {
          type: 'p',
          text: 'Con il single sign-on ci si autentica una volta e si accede a più servizi. Nella federazione un identity provider garantisce l’identità dell’utente ad altri servizi che si fidano di lui.',
        },
        {
          type: 'table',
          head: ['Standard', 'Ruolo'],
          rows: [
            ['LDAP', 'Protocollo per interrogare le directory aziendali (utenti, gruppi)'],
            ['SAML', 'Scambio di asserzioni di autenticazione tra identity provider e servizi, tipico in ambito aziendale'],
            ['OAuth 2.0', 'Delega di autorizzazione: un’app accede a risorse per conto dell’utente [3]'],
            ['OpenID Connect', 'Strato di autenticazione costruito sopra OAuth 2.0 [4]'],
          ],
        },
        {
          type: 'p',
          text: 'Un esempio italiano è SPID, il sistema pubblico di identità digitale: un’identità rilasciata da un gestore accreditato vale per molti servizi pubblici e privati [5].',
        },
      ],
    },
    {
      title: 'Accessi privilegiati (PAM)',
      blocks: [
        {
          type: 'list',
          items: [
            'Just-in-time: i permessi di amministratore si attivano solo quando servono e scadono da soli.',
            'Password vaulting: le credenziali privilegiate sono custodite in una cassaforte e non vengono mostrate all’utente.',
            'Credenziali effimere: generate per una singola sessione e poi invalidate.',
            'Attestazione periodica: i responsabili confermano che ogni accesso è ancora necessario.',
          ],
        },
        {
          type: 'scenario',
          text: 'Il Desktop remoto di srv-01 dovrebbe essere raggiungibile solo dagli amministratori, idealmente tramite jump server con MFA, non da chiunque sia nella Wi-Fi ospiti.',
        },
      ],
    },
  ],
  sources: [
    { title: 'SP 800-63B – Digital Identity Guidelines: Authentication and Lifecycle Management', publisher: 'NIST', url: 'https://pages.nist.gov/800-63-4/sp800-63b.html', lang: 'EN' },
    { title: 'More than a Password (MFA)', publisher: 'CISA', url: 'https://www.cisa.gov/MFA', lang: 'EN' },
    { title: 'RFC 6749 – The OAuth 2.0 Authorization Framework', publisher: 'IETF / RFC Editor', url: 'https://www.rfc-editor.org/info/rfc6749/', lang: 'EN' },
    { title: 'How OpenID Connect Works', publisher: 'OpenID Foundation', url: 'https://openid.net/developers/how-connect-works/', lang: 'EN' },
    { title: 'SPID – Sistema Pubblico di Identità Digitale', publisher: 'AgID / Dipartimento per la trasformazione digitale', url: 'https://www.spid.gov.it/', lang: 'IT' },
    { title: 'Autenticazione a due fattori', publisher: 'Wikipedia', url: 'https://it.wikipedia.org/wiki/Autenticazione_a_due_fattori', lang: 'IT' },
  ],
}

const L4_7: Lesson = {
  objective: '4.7',
  title: 'Automazione e orchestrazione',
  summary: 'Far fare alle macchine i compiti ripetitivi, lasciando le decisioni alle persone.',
  essentials: [
    {
      type: 'p',
      text: 'Un SOC riceve migliaia di eventi al giorno: senza automazione gli analisti affogano. Gli strumenti SOAR (Security Orchestration, Automation and Response) collegano SIEM, firewall, ticketing e altri sistemi ed eseguono playbook, sequenze di azioni predefinite [1][2].',
    },
    {
      type: 'list',
      items: [
        'Casi d’uso: creazione e chiusura di account, apertura di ticket, escalation, arricchimento degli alert, blocco di indirizzi, controlli nelle pipeline di sviluppo.',
        'Benefici: velocità di reazione, configurazioni uniformi, meno errori umani, analisti liberi per i casi difficili.',
        'Attenzioni: complessità, costi, punto unico di guasto, debito tecnico, manutenzione nel tempo.',
      ],
    },
  ],
  deep: [
    {
      title: 'Un playbook per l’alert dello scenario',
      blocks: [
        {
          type: 'example',
          title: 'Playbook “Servizio esposto alla rete ospiti”',
          lines: [
            '1. Trigger: nuovo alert EXPOSED_SERVICE dal SIEM',
            '2. Arricchisci: a quale rete appartiene src_ip? quale servizio è dest_port?',
            '3. Recupera la policy del firewall che ha lasciato passare (campo rule)',
            '4. Apri un ticket con tutti i dati raccolti',
            '5. Proponi la regola di blocco (deny ospiti → srv-01:3389 sopra la regola permissiva)',
            '6. Attendi l’approvazione di un analista, poi applica e verifica',
          ],
        },
        {
          type: 'p',
          text: 'Il passo 6 è importante: le azioni con un forte impatto (bloccare traffico, isolare macchine) spesso richiedono un essere umano nel ciclo. Lo standard OASIS CACAO definisce un formato comune per descrivere e condividere questi playbook [3].',
        },
      ],
    },
    {
      title: 'Script, API e infrastruttura come codice',
      blocks: [
        {
          type: 'list',
          items: [
            'Script (Python, PowerShell, Bash): automatizzano compiti ripetitivi come raccogliere log o controllare configurazioni.',
            'API: permettono ai sistemi di dialogare, ad esempio interrogare Splunk via REST o aggiornare un firewall.',
            'Gestione delle configurazioni (es. Ansible): descrivono lo stato desiderato dei sistemi e lo applicano in modo ripetibile [4].',
            'Guardrail: controlli automatici che impediscono configurazioni pericolose prima che arrivino in produzione.',
          ],
        },
        {
          type: 'p',
          text: 'MITRE D3FEND cataloga le tecniche difensive e aiuta a capire quali contromisure si possono automatizzare per ciascuna tecnica d’attacco [5].',
        },
      ],
    },
  ],
  sources: [
    { title: 'Splunk SOAR', publisher: 'Splunk', url: 'https://www.splunk.com/en_us/products/splunk-security-orchestration-and-automation.html', lang: 'EN' },
    { title: 'What is SOAR?', publisher: 'Splunk', url: 'https://www.splunk.com/en_us/blog/learn/soar-security-orchestration-automation-response.html', lang: 'EN' },
    { title: 'CACAO Security Playbooks v2.0', publisher: 'OASIS', url: 'https://docs.oasis-open.org/cacao/security-playbooks/v2.0/security-playbooks-v2.0.html', lang: 'EN' },
    { title: 'Ansible Documentation', publisher: 'Red Hat / Ansible', url: 'https://docs.ansible.com/', lang: 'EN' },
    { title: 'MITRE D3FEND', publisher: 'MITRE', url: 'https://d3fend.mitre.org/', lang: 'EN' },
  ],
}

const L4_8: Lesson = {
  objective: '4.8',
  title: 'Risposta agli incidenti',
  summary: 'Dall’alert alla correzione e alle lezioni apprese, senza fare danni.',
  scenario: true,
  essentials: [
    {
      type: 'p',
      text: 'Un incidente di sicurezza è un evento che compromette (o minaccia di compromettere) riservatezza, integrità o disponibilità. Per gestirlo senza improvvisare si segue un processo definito in anticipo [1].',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Preparazione: piani, contatti, strumenti e formazione pronti prima che serva.',
        'Rilevamento: un alert, una segnalazione o un’anomalia fanno partire il processo.',
        'Analisi: si capisce cosa è successo, cosa è coinvolto e quanto è grave.',
        'Contenimento: si ferma il danno nel modo più mirato possibile.',
        'Eradicazione: si elimina la causa (malware, account compromesso, configurazione sbagliata).',
        'Ripristino: si torna alla normalità verificando che tutto funzioni.',
        'Lezioni apprese: si documenta e si migliora per la volta successiva.',
      ],
    },
    {
      type: 'scenario',
      text: 'Nell’incidente del gioco: l’alert sul video wall è il rilevamento; la scheda Splunk e la tabella delle policy servono all’analisi; la regola di blocco in cima è il contenimento; rimuovere la regola temporanea R4 sarebbe l’eradicazione.',
    },
  ],
  deep: [
    {
      title: 'Il quadro NIST',
      blocks: [
        {
          type: 'p',
          text: 'La revisione 3 della guida NIST SP 800-61 (2025) inserisce la risposta agli incidenti nelle funzioni del Cybersecurity Framework 2.0 (Govern, Identify, Protect, Detect, Respond, Recover): la risposta non è un reparto isolato ma parte della gestione del rischio di tutta l’organizzazione [1].',
        },
        {
          type: 'p',
          text: 'Contenere in modo mirato è fondamentale: spegnere tutto ferma l’attacco ma anche l’azienda. La soluzione migliore isola solo ciò che serve, il più vicino possibile alla causa.',
        },
      ],
    },
    {
      title: 'Allenarsi prima dell’emergenza',
      blocks: [
        {
          type: 'list',
          items: [
            'Tabletop exercise: il team discute a voce come reagirebbe a uno scenario ipotetico.',
            'Simulazione: si esegue davvero la risposta su un incidente finto, come in questo gioco.',
            'Root cause analysis: dopo l’incidente si cerca la causa profonda, non solo il sintomo (perché esisteva una regola temporanea così larga?).',
            'Threat hunting: si cercano attivamente tracce di attaccanti che gli alert non hanno rilevato.',
          ],
        },
      ],
    },
    {
      title: 'Analisi forense digitale',
      blocks: [
        {
          type: 'p',
          text: 'Se l’incidente può avere conseguenze legali, le prove vanno raccolte senza alterarle [2]. L’RFC 3227 suggerisce di partire dai dati più volatili, che spariscono per primi [3].',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Registri e cache della CPU',
            'Tabelle di routing, cache ARP, processi in esecuzione, memoria RAM',
            'File system temporanei',
            'Dischi',
            'Log remoti e dati di monitoraggio',
            'Configurazione fisica e topologia di rete',
            'Supporti di archivio',
          ],
        },
        {
          type: 'list',
          items: [
            'Catena di custodia: chi ha raccolto ogni prova, quando, e chi l’ha maneggiata dopo.',
            'Legal hold: obbligo di conservare dati rilevanti per un procedimento.',
            'Copie forensi e hash: si lavora su copie, e l’hash dimostra che sono identiche all’originale.',
          ],
        },
      ],
    },
    {
      title: 'Notifiche in Italia',
      blocks: [
        {
          type: 'p',
          text: 'Con la direttiva NIS2, recepita in Italia, i soggetti che rientrano nel perimetro devono notificare gli incidenti significativi a CSIRT Italia: un preallarme entro 24 ore, una notifica entro 72 ore e una relazione finale entro un mese [4][5]. Per i dati personali si applicano inoltre gli obblighi del GDPR.',
        },
        {
          type: 'p',
          text: 'Le guide di CISA sul ransomware sono un esempio pratico di checklist di preparazione e risposta [6].',
        },
      ],
    },
  ],
  sources: [
    { title: 'SP 800-61 Rev. 3 – Incident Response Recommendations and Considerations for Cybersecurity Risk Management', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final', lang: 'EN' },
    { title: 'SP 800-86 – Guide to Integrating Forensic Techniques into Incident Response', publisher: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/86/final', lang: 'EN' },
    { title: 'RFC 3227 – Guidelines for Evidence Collection and Archiving', publisher: 'IETF / RFC Editor', url: 'https://www.rfc-editor.org/info/rfc3227/', lang: 'EN' },
    { title: 'NIS – Direttiva NIS2 in Italia', publisher: 'Agenzia per la Cybersicurezza Nazionale', url: 'https://www.acn.gov.it/portale/nis', lang: 'IT' },
    { title: 'CSIRT Italia', publisher: 'Agenzia per la Cybersicurezza Nazionale', url: 'https://www.acn.gov.it/portale/csirt-italia/', lang: 'IT' },
    { title: '#StopRansomware Guide', publisher: 'CISA', url: 'https://www.cisa.gov/stopransomware/ransomware-guide', lang: 'EN' },
  ],
}

const L4_9: Lesson = {
  objective: '4.9',
  title: 'Fonti di dati per le indagini',
  summary: 'Quali log e dati usare per ricostruire cosa è successo.',
  essentials: [
    {
      type: 'p',
      text: 'Un’indagine è una ricostruzione: chi ha fatto cosa, quando, da dove. Ogni fonte racconta un pezzo della storia, e solo incrociandole si ottiene il quadro completo [1].',
    },
    {
      type: 'table',
      head: ['Fonte', 'Cosa racconta'],
      rows: [
        ['Log del firewall', 'Connessioni permesse e bloccate, con la regola che ha deciso'],
        ['Log delle applicazioni', 'Accessi, errori e operazioni all’interno di un servizio'],
        ['Log dell’endpoint / EDR', 'Processi avviati, file modificati, connessioni del singolo dispositivo'],
        ['Log di sicurezza del sistema operativo', 'Accessi riusciti e falliti, cambi di privilegi [2]'],
        ['IDS / IPS', 'Traffico che corrisponde a firme di attacco'],
        ['Log di rete e flussi', 'Chi ha comunicato con chi e quanto [3]'],
        ['Metadati', 'Informazioni sui dati: intestazioni email, autore e data di un file'],
      ],
    },
  ],
  deep: [
    {
      title: 'Esempi di righe di log',
      blocks: [
        {
          type: 'example',
          title: 'La stessa storia vista da fonti diverse',
          lines: [
            'firewall   action=allowed src=192.168.50.23 dst=srv-01 dport=3389 rule=R4',
            'Windows    Event ID 4625 – accesso non riuscito (account, IP di origine, tipo di accesso)',
            'Linux      sshd: Failed password for root from 203.0.113.45 port 51234 ssh2',
            'EDR        mstsc.exe ha aperto una sessione verso srv-01',
          ],
        },
        {
          type: 'p',
          text: 'L’evento Windows 4625, ad esempio, indica un accesso fallito e riporta l’account usato e l’indirizzo di provenienza: molti 4625 di seguito dallo stesso IP sono un segnale classico di brute force [2].',
        },
      ],
    },
    {
      title: 'Pacchetti, flussi e cruscotti',
      blocks: [
        {
          type: 'list',
          items: [
            'Packet capture: registra il contenuto completo del traffico; strumenti come Wireshark permettono di analizzarlo pacchetto per pacchetto [4].',
            'Analisi di rete: strumenti come Zeek trasformano il traffico in log strutturati di connessioni, DNS, HTTP [3].',
            'Flussi (NetFlow/IPFIX): occupano molto meno spazio dei pacchetti e bastano per capire chi ha parlato con chi [6].',
            'Scansioni di vulnerabilità e report automatici: mostrano se il sistema attaccato era già noto come debole.',
            'Dashboard: in Splunk e negli altri SIEM riassumono a colpo d’occhio l’andamento degli eventi [5].',
          ],
        },
        {
          type: 'p',
          text: 'Perché le fonti si possano incrociare servono orologi sincronizzati (NTP) e log conservati abbastanza a lungo: un’indagine spesso parte settimane dopo l’attacco [1].',
        },
        {
          type: 'scenario',
          text: 'La scheda Splunk del portatile mostra proprio una fonte di dati: le righe del firewall con src_ip, dest, dest_port e rule. Da lì si risale alla regola R4.',
        },
      ],
    },
  ],
  sources: [
    S.nist80092,
    {
      title: '4625(F): An account failed to log on',
      publisher: 'Microsoft Learn',
      url: 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4625',
      lang: 'EN',
    },
    { title: 'Zeek Documentation', publisher: 'Zeek Project', url: 'https://docs.zeek.org/en/master/', lang: 'EN' },
    { title: 'Wireshark Documentation', publisher: 'Wireshark Foundation', url: 'https://www.wireshark.org/docs/', lang: 'EN' },
    S.splunkTutorial,
    S.ipfix,
  ],
}

export const DOMAIN4_LESSONS: Lesson[] = [L4_1, L4_2, L4_3, L4_4, L4_5, L4_6, L4_7, L4_8, L4_9]
