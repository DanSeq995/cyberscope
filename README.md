# Clara Netroom

Scaffold del serious game di networking e cybersecurity per la challenge **Consorzio Clara / Cisco Networking Academy**. In questa fase il repository contiene l’impianto tecnico e una **greybox dell’ufficio del blue team** (stanza 12 × 10 m in scala reale, solo primitive): ingresso, sala server con rack, area SOC con video wall, open space, servizi, più una stanza a est per il nuovo team. Gli oggetti grigi sono statici, quelli arancioni sono i futuri punti di interazione. Il giocatore si muove **in prima persona** con collisioni Rapier. **Non** ci sono ancora missioni multiple, punteggi o room Colyseus.

## Scelta della squadra

All’avvio si sceglie con quale squadra giocare. Le due partite sono **indipendenti** e si svolgono in **stanze non collegate**:

- **Blue team**: l’ufficio descritto sotto (SOC, firewall, PC di studio, PC del sistemista).
- **Red team**: una stanza chiusa, staccata dall’ufficio, con un PC collegato alla rete ospiti.

Dalla schermata di pausa (**Esc**) il pulsante **Cambia squadra** riporta alla scelta; lo stato delle due partite resta com’è e si riparte dal punto di ingresso della stanza.

## Red team: percorso a fasi con punteggio

Dietro la sedia del PC con lo schermo acceso premi **E**: si apre un terminale con, a destra, le cinque fasi del percorso (tattica e tecnica MITRE ATT&CK), la domanda della fase e le risposte (mouse o tasti **1–4**). Ogni scelta viene “eseguita” nel terminale; se è sbagliata compare la spiegazione, l’opzione si disattiva e si riprova.

**Punteggio** (1000 punti: 150, 150, 200, 200, 300 per fase): risposta giusta al primo tentativo = 100% dei punti della fase, al secondo = 40%, dal terzo = 0. Rispondendo a caso si resta in media sotto i 500 punti, cioè sotto il primo grado utile; l’ordine delle risposte cambia a ogni partita e non c’è bonus di tempo. Gradi: Operatore red team (≥ 90%), Penetration tester (≥ 70%), Analista junior (≥ 50%), Da ripassare. A fine percorso compaiono il riepilogo per fase, il record della sessione e **Rigioca**.

Le cinque fasi seguono la catena MITRE ATT&CK e ricostruiscono lo stesso incidente che il blue team indaga su Splunk: ricognizione della propria rete (**T1016**), scoperta degli host raggiungibili (**T1018**), scansione dei servizi di `srv-01` (**T1046**), analisi della causa (la regola di firewall R4 troppo permissiva) e accesso via Desktop remoto (**T1021.001**). È una simulazione a quiz: nessun comando viene eseguito e il percorso non invia eventi a Splunk (l’incidente del blue team parte sempre con **T**).

Codice: `src/sim/attack.ts` (fasi), `src/sim/score.ts` (punteggio e gradi), `src/state/red.ts` (stato), `src/ui/red/RedTerminal.tsx` (terminale), `src/ui/TeamSelect.tsx` (scelta squadra).

## PC di studio

Il primo PC del bancone SOC (quello con lo schermo acceso, vicino all’ingresso) serve a **studiare la teoria**, in qualsiasi momento. Mettiti dietro la sua sedia e premi **E**: la camera scivola sul monitor e si apre “Netroom Academy”, un percorso basato sui **5 domini e 28 obiettivi di CompTIA Security+ SY0-701** (testi originali in italiano). Ogni lezione ha una parte **Essenziale**, sezioni di **Approfondimento**, note **[n]** cliccabili e un elenco **Fonti e link** (NIST, IETF/RFC, IANA, Splunk, Cisco NetAcad, CISA, MITRE, ACN/CSIRT Italia, AgID…) con la lingua indicata; i link si aprono in una nuova scheda. Le lezioni utili all’incidente hanno il badge “incidente”.

Le lezioni arrivano **a tappe**: oggi sono disponibili l’intero dominio 4 (Operazioni di sicurezza) e l’obiettivo 3.2 (Infrastruttura aziendale sicura, con firewall, segmentazione e porte); gli altri obiettivi compaiono nell’indice come “in arrivo”. I contenuti sono in `src/sim/theory/` (`domains.ts` per l’indice, un file per dominio).

Sui PC a tutto schermo (questo e il portatile del firewall) **il mouse si libera**: clicchi lezioni, schede, risposte e il pulsante **✕ Chiudi**, e la rotella scorre normalmente; restano validi anche i tasti (**← →** per le lezioni). **E** o **✕** riportano all’ufficio ricatturando il mouse; **Esc** chiude il PC e mette in pausa. I testi sono in `src/sim/theory.ts`: per aggiungere una lezione basta un nuovo elemento.

## PC del sistemista e simulatore di rete

Il secondo PC acceso del bancone SOC, accanto a quello di studio, è la **postazione del sistemista**. In alto a sinistra l’HUD mostra la “Richiesta IT” in corso. Con **E** dietro la sedia si apre il desktop con due schede:

1. **Posta**: la mail della responsabile IT chiede un server per il nuovo team Progetti, nella stanza a est dell’open space, con tutti i dati (indirizzi, porte, regola del firewall).
2. **Simulatore di rete** (impostazione alla Cisco Packet Tracer, grafica originale): la rete aziendale è già disegnata e non si modifica. Dalla palette in basso aggiungi **firewall, router e server** (click sul dispositivo e poi sull’area di lavoro, oppure trascinamento), con lo strumento **Cavo** scegli le porte da collegare, con un click su un dispositivo apri la sua configurazione (stato delle porte, IP, maschera, gateway, regole del firewall). **Verifica** esegue i controlli in ordine e si ferma al primo errore spiegando cosa non va: apparati, cablaggio `sw-core → firewall → router → server`, indirizzi, ping al gateway, HTTPS dagli uffici (deve passare), HTTPS dagli ospiti e RDP dagli uffici (devono essere bloccati).

Quando la verifica passa il progetto è approvato: un anello giallo indica il rack nella **stanza del nuovo team** (porta nel muro est, accanto alla stampante). Davanti al rack **E** monta gli apparati, che compaiono con i LED accesi, e in posta arriva la conferma.

Dati dello scenario in `src/sim/network/` (`scenario.ts` per rete esistente, valori richiesti e mail; `check.ts` per i controlli), stato in `src/state/work.ts`, interfaccia in `src/ui/work/`. La challenge è indipendente dalla simulazione dell’incidente (tasto **T**).

## Simulazione incidente e risoluzione

Premendo **T** parte la simulazione: traffico normale di uffici e Wi-Fi ospiti e, dopo ~12 s, un **errore di configurazione del firewall**. La regola R4 (“temporanea: test fornitore”, permit any → srv-01) lascia un dispositivo della rete ospiti `192.168.50.23` collegarsi al Desktop remoto (RDP, tcp/3389) di `srv-01`. Gli eventi finiscono in uno **Splunk simulato** nel browser; la correlation search “Servizio interno esposto alla rete ospiti” genera l’alert e **la simulazione si ferma**: parte la fase di risoluzione.

1. La dashboard SIEM sul **video wall del SOC** (o a tutto schermo con **F**) mostra l’alert, la query SPL equivalente e le ultime chiamate API; il rack di `srv-01` diventa rosso e un anello giallo indica l’armadio di rete in sala server.
2. Davanti all’armadio premi **E**: in mano compare un portatile che si apre e si avvicina finché lo schermo riempie la vista; il browser va sulla console del firewall `fw-01` e fa il login da solo. Con **Tab** passi alla scheda **Splunk**, che mostra l’alert campo per campo (IP, server, porta, regola) se ti serve rivederlo.
3. La console riassume la situazione (cosa è successo, perché è un problema, cosa fare, con uno schema dei flussi di rete), mostra le policy attuali e chiede quale usare per bloccare l’RDP dalla rete ospiti. Rispondi con **1 / 2 / 3**: se sbagli vedi perché e riprovi; con la risposta giusta la nuova regola R0 va in cima, un test di connessione risulta bloccato e il SOC passa a “incidente risolto”.

Dati dello scenario: `src/sim/redteam.ts` (eventi), `src/sim/detection.ts` (regola), `src/sim/firewall.ts` (policy, domanda e spiegazioni).

Il finto Splunk (`src/sim/splunk/`) ha la **stessa forma dell’API reale**: il red team invia gli eventi come con HEC (`POST /services/collector/event`), la dashboard legge come con la REST API (`/services/search/jobs`, `/services/alerts/fired_alerts`). Per collegare uno Splunk vero basterà un’altra implementazione di `SplunkClient` che passi da un backend (mai direttamente dal browser: i token resterebbero esposti).

## Comandi di gioco

| Tasto | Azione |
|---|---|
| Click | entra (cattura il mouse) |
| W A S D / frecce | muoviti |
| Mouse | guardati intorno |
| Shift | corri |
| Esc | pausa (rilascia il mouse) |
| V | alterna prima persona / vista pianta dall’alto |
| T | blue team: avvia la simulazione / la azzera |
| F | blue team: apre / chiude la dashboard SOC a tutto schermo (il giocatore resta fermo) |
| E | al PC di studio (SOC): apre / chiude la teoria · al PC del sistemista: apre / chiude posta e simulatore di rete · con il progetto approvato, davanti al rack della nuova stanza: monta gli apparati · durante l’incidente, davanti all’armadio di rete: apre / chiude il portatile |
| ← → | nella teoria: lezione precedente / successiva |
| 1 / 2 / 3 | nella console del firewall: sceglie la risposta |
| 1 – 4 | red team, nel terminale: sceglie la risposta |
| Tab | nel portatile: alterna le schede Firewall e Splunk |
| Rotella / ↑ ↓ / PagSu PagGiù | nel portatile e nella teoria: scorre la pagina |

## Stack

- **Vite** + **React** + **TypeScript**
- **React Three Fiber** e **drei** (scena in `src/scene/Scene.tsx`, greybox in `src/scene/office/`, planimetria in `layout.ts`); **Rapier** per collisioni e giocatore (`src/scene/player/`)
- **Zustand** (stato vista/puntatore/zona in `src/state/game.ts`, simulazione SOC in `src/state/soc.ts`); **Colyseus**, **@colyseus/sdk** installati, non ancora usati
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **shadcn/ui** (preset Nova, Radix)

## Comandi

```bash
npm install
npm run dev      # http://127.0.0.1:5190
npm run build
npm run lint
npm run preview  # stessa porta 5190
```

Il server di sviluppo e la preview sono configurati sulla porta **5190** con `host: true` e `strictPort: true`.