# Calcolatore di Investimento

## Link all'Applicazione Web
[Inserire il link all'applicazione]

## Descrizione
Questa applicazione web permette di simulare e confrontare strategie di investimento basate su due opzioni: **Standard** e **Premium**. Gli utenti possono calcolare i rendimenti futuri di un investimento personalizzando:

- Risparmi mensili
- Tasso di interesse
- Costi aggiuntivi

L'obiettivo è identificare la combinazione ottimale per massimizzare il guadagno su un periodo specificato.

### Opzioni di investimento
- **Standard:** Utilizza il tasso lordo annuale senza costi aggiuntivi.
- **Premium:** Aumenta il tasso lordo annuale dello 0,1% (es. da 5% a 5,1%) ma applica un costo fisso di **49,99 € per anno**.

L'applicazione calcola e confronta:
- Il rendimento di un investimento interamente **Standard**.
- Il rendimento di un investimento interamente **Premium**.
- **Le 10 combinazioni migliori** per guadagno finale.

## Funzionalità
- **Input personalizzati**: Data di inizio, anni, saldo iniziale, mesi per rinnovo, risparmi mensili e tasso annuo.
- **Tabella interattiva**: Mostra e permette di modificare i risparmi mensili.
- **Calcolo dei profitti**: Considera interessi composti, tassazione al 26% e costi Premium.
- **Ottimizzazione per periodi lunghi**: Per anni > 20, riduce il numero di combinazioni per migliorare le prestazioni.
- **Esportazione dati**: Salvataggio della tabella e dei risultati in file `.txt`.
- **Formattazione numerica**: Usa il formato italiano (es. `1.234,56 €`).

## Tecnologie Utilizzate
- **HTML5**: Struttura della pagina e form di input.
- **CSS3**: Stili personalizzati e design responsive.
- **JavaScript**: Logica di calcolo, gestione del DOM e interattività.

## Utilizzo
1. **Accedi all'applicazione** (link sopra).
2. **Inserisci i parametri**:
   - **Data di Inizio** (es. `01/04/2025`)
   - **Anni** (es. `5`)
   - **Saldo Iniziale** (es. `5000 €`)
   - **Mesi per Rinnovo** (es. `3` per calcolo trimestrale)
   - **Risparmio Mensile** (valore singolo o lista, es. `100, 200, 300`)
   - **Tasso Lordo Annuale** (es. `2,75%`)
3. **Genera la tabella dei risparmi**.
4. **Modifica la tabella** (opzionale).
5. **Calcola i profitti**.
6. **Esporta i dati** nei formati disponibili.

## Struttura del Progetto
```
calcolatore-investimento/
├── icona.png       # Icona del sito
├── index.html      # Struttura HTML
├── style.css       # Stili CSS
├── script.js       # Logica JavaScript
├── LICENSE         # Licenza MIT (opzionale)
└── README.md       # Documentazione
```

## Dettagli dei Calcoli
### Parametri di Input
- **Data di Inizio**: Punto di partenza della simulazione.
- **Anni**: Durata totale dell’investimento.
- **Saldo Iniziale**: Capitale iniziale in euro.
- **Mesi per Rinnovo**: Frequenza di calcolo degli interessi.
- **Risparmio Mensile**: Valore fisso o sequenza ciclica.
- **Tasso Lordo Annuale**: Percentuale di interesse annuale.

### Variabili Derivate
- **Mesi Totali** = Anni × 12
- **Periodi per Anno** = 12 ÷ Mesi per Rinnovo
- **Tasso Standard per Periodo** = Tasso Lordo Annuale ÷ Periodi per Anno
- **Tasso Premium per Periodo** = (Tasso Lordo Annuale + 0,001) ÷ Periodi per Anno
- **Numero Totale di Periodi** = Mesi Totali ÷ Mesi per Rinnovo
- **Costo Premium** = 49,99 € per ogni anno di Premium
- **Tassa sugli Interessi** = 26% sugli interessi lordi

### Logica di Calcolo
- **Tabella dei Risparmi**: Creata ciclicamente, modificabile manualmente.
- **Accumulo Risparmi**: Sommati in blocchi di `Mesi per Rinnovo`.
- **Calcolo del Rendimento**:
  - Applica il tasso (Standard o Premium).
  - Calcola gli interessi netti (dopo il 26% di tasse).
  - Aggiunge i risparmi del periodo.
  - Sottrae il costo Premium (se applicabile).
- **Combinazioni Calcolate**:
  - **Per anni ≤ 20**: tutte le combinazioni possibili (`2^Anni`).
  - **Per anni > 20**: solo combinazioni ottimizzate.

### Output
- **Tutto Standard**: Combinazione `00...0`.
- **Tutto Premium**: Combinazione `11...1`.
- **Top 10**: Le migliori combinazioni per guadagno finale.
- **Dettagli**: Saldo finale, guadagno netto, costo Premium totale.

## Vantaggi
✅ **Personalizzazione completa**: Risparmi mensili e durata modificabili.
✅ **Confronto chiaro**: Visualizzazione dei rendimenti per ogni opzione.
✅ **Esportazione dati**: Salvataggio delle simulazioni.
✅ **Interattività**: Tabella modificabile e calcolo immediato.
✅ **Ottimizzazione**: Gestisce periodi lunghi senza sovraccarico.

## Svantaggi
❌ **Limitazione per periodi lunghi**: Per anni > 20, riduce il numero di combinazioni calcolate.
❌ **Simulazione teorica**: Non tiene conto di fluttuazioni reali del mercato.

## Avviso
> Questo programma è uno strumento di simulazione e potrebbe contenere imprecisioni. Non sostituisce una consulenza finanziaria. Prima di investire, consulta un professionista.