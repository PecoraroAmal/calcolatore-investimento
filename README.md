# Calcolatore di Investimento

https://pecoraroamal.github.io/calcolatore-investimento/

Un'applicazione web per calcolare e confrontare strategie di investimento basate su due opzioni: **Standard** e **Premium**. L'obiettivo è determinare la combinazione ottimale per massimizzare il guadagno finale.

## Descrizione

Questa applicazione consente agli utenti di inserire parametri finanziari e calcolare il rendimento di un investimento su un periodo specificato. Confronta due opzioni:
- **Standard**: Usa il tasso lordo annuale fornito dall'utente.
- **Premium**: Aumenta il tasso lordo annuale dello 0,1%, ma applica un costo fisso di 49,99 € per ogni anno in cui viene scelta.

L'applicazione mostra:
- Il risultato per un investimento tutto Standard (solo "0").
- Il risultato per un investimento tutto Premium (solo "1").
- Le 10 migliori combinazioni di Standard e Premium, ordinate per guadagno finale.

## Funzionalità

- **Input validati**: Controlli su mesi (multiplo di 12), saldo iniziale (1000-10M), ecc.
- **Calcolo dettagliato**: Include interessi tassati al 26% e aggiunta di risparmi periodici.
- **Ottimizzazione**: Per periodi > 240 mesi, usa un calcolo approssimativo per evitare sovraccarico computazionale.
- **Esportazione**: Risultati salvabili in un file `.txt`.
- **Interfaccia utente**: Design responsive con animazione di caricamento.

## Tecnologie

- **HTML5**: Struttura della pagina.
- **CSS3**: Stili e animazioni (es. spinner).
- **JavaScript**: Logica di calcolo e gestione del DOM.

## Utilizzo

Inserisci i valori nei campi del form:
- **Mesi**: Deve essere multiplo di 12 (es. 12, 24, 36).
- **Saldo Iniziale**: Tra 1000 e 10.000.000 €.
- **Risparmio Mensile**: ≥ 0 €.
- **Mesi per Rinnovo**: ≥ 1 (determina la frequenza di calcolo degli interessi).
- **Tasso Lordo Annuale**: Percentuale ≥ 0 (es. 5 per 5%).

Clicca su "Calcola".

Visualizza i risultati e usa "Salva Risultati" per scaricare un file di testo.

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
- **Mesi**: Numero totale di mesi (es. 24).
- **Saldo Iniziale**: Importo iniziale investito (es. 5000 €).
- **Risparmio Mensile**: Importo aggiunto ogni mese (es. 100 €).
- **Mesi per Rinnovo**: Frequenza di calcolo degli interessi (es. 6 mesi).
- **Tasso Lordo Annuale**: Percentuale annua (es. 5% = 0,05).

### 2. Variabili Derivate
- **Anni**: `Math.ceil(Mesi / 12)`
- **Saldo Aggiunto al Rinnovo**: `Risparmio Mensile * Mesi per Rinnovo`
- **Periodi per Anno**: `12 / Mesi per Rinnovo`
- **Tasso per Periodo Standard**: `Tasso Lordo Annuale / Periodi per Anno`
- **Tasso per Periodo Premium**: `(Tasso Lordo Annuale + 0,001) / Periodi per Anno`
- **Numero Totale di Periodi**: `Math.floor(Mesi / Mesi per Rinnovo)`
- **Costo Premium**: `49,99 € per ogni anno in cui si sceglie Premium`
- **Tassa sugli Interessi**: `26% (0,26)`

### 3. Logica di Calcolo per una Combinazione

Ogni combinazione è una stringa binaria (es. "01" per 2 anni: Standard il primo anno, Premium il secondo). Per ogni combinazione:

#### Algoritmo
1. Inizializza: `Saldo = Saldo Iniziale`, `Costo Premium Totale = 0`.
2. Per ogni anno:
   - Calcola i periodi rimanenti nell'anno.
   - Per ogni periodo:
     - Scegli il tasso.
     - Calcola gli interessi e applica la tassa.
     - Aggiorna il saldo.
   - Se Premium (“1”): sottre `49,99` dal saldo.

### 4. Generazione delle Combinazioni
- **Mesi ≤ 240**: Calcola tutte le combinazioni possibili.
- **Mesi > 240**: Calcola solo combinazioni specifiche per evitare eccessiva computazione.

### 5. Output
- **Tutto Standard**: Combinazione "00...0".
- **Tutto Premium**: Combinazione "11...1".
- **Top 10**: Le 10 combinazioni con il maggior Guadagno Finale.
- **Formato numerico**: Italiano (es. 1.234,56€).

## Limitazioni
- Per periodi > 240 mesi, il calcolo è approssimativo.
- Non supporta tassi negativi o perdite.
- Assume che il risparmio mensile sia costante.