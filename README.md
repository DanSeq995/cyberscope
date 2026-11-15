# Clara Netroom

Serious game browser di networking e cybersecurity per la challenge **Consorzio Clara / Cisco Networking Academy**.

## Requisiti

- [Node.js](https://nodejs.org/) 22.12 o superiore (consigliata l'ultima LTS)
- npm (incluso in Node.js)
- Un browser recente (Chrome, Edge, Firefox)

## Avvio in locale

```bash
# 1. Installa le dipendenze (solo la prima volta)
npm install

# 2. Avvia il server di sviluppo
npm run dev
```

Apri **http://127.0.0.1:5190** nel browser.

## Altri comandi

```bash
npm run build     # build di produzione nella cartella dist/
npm run preview   # serve la build su http://127.0.0.1:5190
npm run lint      # controllo del codice
```

## Comandi di gioco principali

- **WASD / frecce**: movimento — **Shift**: corsa — **mouse**: guarda intorno
- **E**: interagisci (porte, PC, rack)
- **V**: vista pianta
- **C**: chat di squadra (testo e chiamata audio) — **M**: microfono durante la chiamata
- **Esc**: pausa / cambia squadra
- **Esc → Nuova partita**: azzera crediti e progressi (anche dalla schermata di scelta della squadra)

## Chat di squadra (Webex)

Il tasto **C** apre la chat in qualunque punto della partita. Ci sono tre stanze fisse (Blue Team SOC, Red Team Ops,
Generale) e una chiamata solo audio. Per collegarla a Webex crea `.env.local` nella root:

```bash
VITE_WEBEX_ACCESS_TOKEN=...
VITE_WEBEX_ROOM_BLUE=...
VITE_WEBEX_ROOM_RED=...
VITE_WEBEX_ROOM_GENERAL=...
```

Senza token, o con un token non valido, la chat funziona in modalità locale: messaggi in memoria e chiamata simulata.
Al primo alert dell'incidente, in «Blue Team SOC» parte da solo un breve dialogo tra Analista SOC e Amministratore di
rete (il giocatore). Resta locale e non viene inviato a Webex.
Attenzione: un token in una variabile `VITE_` finisce nel bundle del client ed è un unico utente Webex condiviso da
tutti i giocatori. Va bene per provare l'integrazione, non per la produzione.

## Knowledge Credits (blue team)

I **Knowledge Credits (KC)** sono la valuta del blue team. Il saldo compare in basso a destra e vale per **una partita**: è condiviso da tutte le postazioni e resta se cambi squadra, ma riparte da zero quando ricarichi la pagina o scegli **Nuova partita**.

**Come si guadagnano: al PC Biblioteca (PC di studio nel SOC)**

- **Manuali**: leggere una lezione dà **+10 KC ogni 15 s di lettura attiva**. Il tempo conta solo se scorri, muovi il mouse o usi i tasti, e si ferma dopo 15 s senza attività. Il limite è di 40 KC per lezione e 300 KC per partita. La barra *Analisi Documentazione* in alto mostra a che punto sei.
- **Cyber Certification · Training Lab**: 5 domini Security+ con 20 livelli ciascuno, in ordine di difficoltà. Per sbloccare un livello devi rispondere bene al precedente. La prima risposta giusta vale **15 + 5 × livello** KC. Dopo ogni scelta compare la spiegazione di quella risposta. Dopo un errore c'è un'attesa di 5 s, poi le risposte vengono rimescolate.

**Come si spendono: Analisi Assistita (−30 KC)**

- **Console del firewall** (portatile, durante l'incidente): *50/50* toglie una risposta sbagliata, *Indizio sul log* spiega cosa mostra il log. Si possono ricomprare a ogni nuova simulazione (T).
- **Simulatore di rete** (PC del sistemista): dà un suggerimento sul primo controllo non superato dell'ultima Verifica.

Se i crediti non bastano il pulsante è disattivato e rimanda al PC Biblioteca.

I quesiti si trovano in `src/sim/theory/quiz/questions.json`. Se il file contiene errori (numero di risposte, risposta corretta mancante, livelli non consecutivi), in sviluppo compare un messaggio nella console del browser.
