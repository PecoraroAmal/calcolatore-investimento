# Calcolatore di Investimento

[Link all'applicazione web](https://pecoraroamal.github.io/calcolatore-investimento/)

Un'applicazione web progettata per calcolare e confrontare strategie di investimento basate su due opzioni: **Standard** e **Premium**. L'obiettivo è aiutare gli utenti a simulare il rendimento di un investimento e identificare la combinazione ottimale per massimizzare il guadagno finale su un periodo specificato.

## Descrizione

Questa applicazione consente agli utenti di inserire parametri finanziari personalizzati per simulare un investimento a lungo termine. Confronta due opzioni di investimento:
- **Standard**: Utilizza il tasso lordo annuale fornito dall'utente senza costi aggiuntivi.
- **Premium**: Aumenta il tasso lordo annuale dello 0,1% (es. da 5% a 5,1%), ma applica un costo fisso di 49,99 € per ogni anno in cui viene scelta questa opzione.

L'applicazione calcola i rendimenti per tutte le combinazioni possibili di Standard e Premium (entro certi limiti) e presenta:
- Il risultato per un investimento interamente Standard (tutti "0").
- Il risultato per un investimento interamente Premium (tutti "1").
- Le 10 migliori combinazioni ordinate per guadagno finale.

## Funzionalità

- **Input validati**: Controlli rigorosi sui valori inseriti (es. mesi multipli di 12, saldo iniziale tra 1000 e 10.000.000 €).
- **Tabella dei risparmi modificabile**: Genera una tabella basata sull'input iniziale, con possibilità di modifiche manuali da parte dell'utente.
- **Calcolo dettagliato**: Somma i risparmi in blocchi pari ai mesi per rinnovo e calcola gli interessi tassati al 26%, senza utilizzare la media nei calcoli (mostrata solo a scopo informativo).
- **Ottimizzazione computazionale**: Per periodi superiori a 240 mesi, utilizza un calcolo approssimativo per evitare sovraccarico.
- **Esportazione dei risultati**: Possibilità di salvare la tabella dei risparmi, i risultati dei profitti o entrambi in file `.txt`.
- **Interfaccia utente**: Design responsive con animazione di caricamento durante i calcoli.

## Tecnologie Utilizzate

- **HTML5**: Struttura della pagina e form di input.
- **CSS3**: Stili personalizzati, layout responsive e animazione dello spinner di caricamento.
- **JavaScript**: Logica di calcolo, gestione del DOM e interattività.

## Utilizzo

1. Accedi all'applicazione tramite il [link](#).
2. Compila il form con i seguenti parametri:
   - **Data di Inizio**: Data di apertura del conto (es. 2025-01-01).
   - **Mesi**: Durata totale dell'investimento, multiplo di 12 (es. 12, 24, 240).
   - **Saldo Iniziale**: Importo iniziale investito, tra 1000 e 10.000.000 €.
   - **Mesi per Rinnovo**: Frequenza di calcolo degli interessi (es. 3 per trimestrale).
   - **Risparmio Mensile**: Valore singolo (es. 100) o lista di valori pari ai mesi per rinnovo (es. 100, 110, 120 per 3 mesi), applicata ciclicamente.
   - **Tasso Lordo Annuale**: Percentuale annuale ≥ 0,1% (es. 5 per 5%).
3. Clicca su **"Genera Tabella"** per visualizzare la tabella dei risparmi mensili.
4. Modifica i valori nella tabella, se necessario.
5. Clicca su **"Genera Profitti"** per calcolare i rendimenti.
6. Usa i pulsanti **"Salva Tabella Risparmi"**, **"Salva Risultati"** o **"Salva Risparmi e Profitti"** per esportare i dati.

## Struttura del Progetto

```
calcolatore-investimento/
├── index.html      # Struttura HTML
├── style.css       # Stili CSS
├── script.js       # Logica JavaScript
└── README.md       # Documentazione
```

## Dettagli dei Calcoli

### 1. Parametri di Input
- **Data di Inizio**: Determina il mese e l'anno di partenza (es. 2025-01-01 → gennaio 2025).
- **Mesi**: Durata totale dell'investimento in mesi, deve essere divisibile per 12 (es. 12).
- **Saldo Iniziale**: Importo iniziale in euro (es. 5000 €).
- **Mesi per Rinnovo**: Frequenza con cui vengono calcolati gli interessi e aggiunti i risparmi (es. 3 per trimestrale).
- **Risparmio Mensile**: Valore singolo (es. 100 €) o lista ciclica di lunghezza pari a `Mesi per Rinnovo` (es. 100, 110, 120), applicata ripetutamente per popolare la tabella.
- **Tasso Lordo Annuale**: Percentuale annua del tasso di interesse (es. 5% = 0,05).

### 2. Variabili Derivate
- **Anni**: Numero di anni dell'investimento, calcolato come `Math.ceil(Mesi / 12)` (es. 12 mesi = 1 anno).
- **Periodi per Anno**: Numero di rinnovi in un anno, calcolato come `12 / Mesi per Rinnovo` (es. 12 / 3 = 4).
- **Tasso per Periodo Standard**: Tasso annuo diviso per il numero di periodi per anno (es. 0,05 / 4 = 0,0125).
- **Tasso per Periodo Premium**: Tasso annuo + 0,001 diviso per il numero di periodi per anno (es. (0,05 + 0,001) / 4 = 0,01275).
- **Numero Totale di Periodi**: Numero totale di rinnovi, calcolato come `Math.floor(Mesi / Mesi per Rinnovo)` (es. 12 / 3 = 4).
- **Costo Premium**: 49,99 € per ogni anno in cui si sceglie l'opzione Premium.
- **Tassa sugli Interessi**: 26% degli interessi lordi (0,26).

### 3. Logica di Calcolo per una Combinazione
Ogni combinazione è rappresentata come una stringa binaria lunga quanto il numero di anni (es. "01" per 2 anni: Standard, Premium). Il calcolo segue questi passaggi:

#### Algoritmo
1. **Generazione della Tabella**:
   - La tabella dei risparmi è popolata ciclicamente con i valori di `Risparmio Mensile` (es. "100, 110, 120" ripetuto ogni 3 mesi).
   - L'utente può modificare manualmente i valori nella tabella.
2. **Raccolta dei Risparmi**:
   - I valori effettivi della tabella vengono raccolti in `savingsList`.
   - Questi vengono sommati in blocchi di `Mesi per Rinnovo` per creare `renewalSavingsList` (es. 100 + 110 + 120 = 330).
3. **Calcolo del Rendimento**:
   - Inizializza: `Saldo = Saldo Iniziale`, `Costo Premium Totale = 0`.
   - Per ogni anno:
     - Determina il numero di periodi rimanenti nell'anno.
     - Per ogni periodo:
       - Seleziona il tasso (Standard o Premium).
       - Calcola l'interesse: `Interesse = Saldo * Tasso per Periodo`.
       - Applica la tassa: `Interesse Netto = Interesse * (1 - 0,26)`.
       - Aggiungi il saldo del rinnovo: `Saldo += Interesse Netto + renewalSavingsList[periodo]`.
     - Se Premium ("1"): sottrai 49,99 € dal saldo e aggiorna il costo totale.
4. **Risultati**:
   - `Totale Risparmi = Somma di renewalSavingsList`.
   - `Guadagno Finale = Saldo - Saldo Iniziale - Totale Risparmi`.
   - `Saldo Finale = Saldo`.

### 4. Generazione delle Combinazioni
- **Per Mesi ≤ 240**: Calcola tutte le possibili combinazioni binarie (2^Anni). Es. per 2 anni: "00", "01", "10", "11".
- **Per Mesi > 240**: Calcola solo combinazioni specifiche (es. "000...0" a "111...1" e viceversa) per ridurre il carico computazionale, con un avviso di approssimazione.

### 5. Output
- **Tutto Standard**: Risultato della combinazione "00...0".
- **Tutto Premium**: Risultato della combinazione "11...1".
- **Top 10 Combinazioni**: Le 10 combinazioni con il maggior `Guadagno Finale`, ordinate in modo decrescente.
- **Media Risparmio al Rinnovo**: Calcolata come media dei valori in `renewalSavingsList`, mostrata solo a scopo informativo, non usata nei calcoli.
- **Formato Numerico**: Italiano (es. 1.234,56 €), con virgole per i decimali e punti per le migliaia.
- **Tabella dei Risparmi**: Mostra i risparmi mensili organizzati per anno in un formato verticale leggibile.

### Esempio di Calcolo
**Input**: 
- Data di Inizio: 2025-01-01
- Mesi: 12
- Saldo Iniziale: 5000 €
- Mesi per Rinnovo: 3
- Risparmio Mensile: 100, 110, 120
- Tasso Lordo Annuale: 5%

**Tabella Iniziale**:
- Gennaio: 100, Febbraio: 110, Marzo: 120, Aprile: 100, Maggio: 110, Giugno: 120, ecc.

**Variabili Derivate**:
- Anni: 1
- Periodi per Anno: 4
- Tasso per Periodo Standard: 0,0125 (1,25%)
- Tasso per Periodo Premium: 0,01275 (1,275%)
- Numero Totale di Periodi: 4
- `renewalSavingsList`: [330, 330, 330, 330]

**Combinazione "0"**:
1. Periodo 1: Saldo = 5000 → Interesse = 62,5 → Netto = 46,25 → Saldo = 5376,25
2. Periodo 2: Saldo = 5376,25 → Interesse = 67,20 → Netto = 49,73 → Saldo = 5755,98
3. Periodo 3: Saldo = 5755,98 → Interesse = 71,95 → Netto = 53,24 → Saldo = 6139,22
4. Periodo 4: Saldo = 6139,22 → Interesse = 76,74 → Netto = 56,79 → Saldo = 6526,01
- Totale Risparmi: 1320 € (330 * 4)
- Guadagno Finale: 206,01 € (6526,01 - 5000 - 1320)
- Saldo Finale: 6526,01 €

**Modifica Manuale**:
- Cambia Giugno da 120 a 130 → `renewalSavingsList`: [330, 340, 330, 330]
- Totale Risparmi: 1330 €
- Il calcolo si aggiorna di conseguenza.

## Limitazioni
- **Calcolo approssimativo per > 240 mesi**: Non tutte le combinazioni vengono calcolate per evitare tempi di elaborazione eccessivi.
- **Tassi negativi non supportati**: L'applicazione assume tassi ≥ 0,1%.
- **Risparmio mensile**: Deve essere un valore singolo o una lista di lunghezza pari a `Mesi per Rinnovo`; variazioni arbitrarie sono possibili solo con modifiche manuali.
- **Interessi composti**: Assume reinvestimento totale senza prelievi parziali.
- **Precisione**: Essendo una simulazione, i risultati possono contenere errori o arrotondamenti.

## Avviso
Questo programma è uno strumento di simulazione e non deve essere considerato un sostituto per la consulenza finanziaria professionale. I risultati sono indicativi e possono contenere imprecisioni. Non è un incentivo all'investimento; consulta un esperto prima di prendere decisioni finanziarie.

## Contributi
Suggerimenti e contributi sono benvenuti! Apri una issue o una pull request su [GitHub](https://github.com/PecoraroAmal/calcolatore-investimento).