// Selezione degli elementi DOM necessari per interagire con l'interfaccia
const form = document.getElementById('investmentForm'); // Form di input
const loader = document.getElementById('loader'); // Indicatore di caricamento
const resultsDiv = document.getElementById('results'); // Div per i risultati dei profitti
const savingsTableDiv = document.getElementById('savingsTable'); // Div per la tabella dei risparmi
const calculateProfitsBtn = document.getElementById('calculateProfits'); // Pulsante per calcolare i profitti
const saveSavingsBtn = document.getElementById('saveSavings'); // Pulsante per salvare la tabella dei risparmi
const saveResultsBtn = document.getElementById('saveResultsBtn'); // Pulsante per salvare i risultati
const saveAllBtn = document.getElementById('saveAll'); // Pulsante per salvare tutto

// Funzione per formattare i numeri nel formato italiano (es. 1.234,56)
const formatNumber = (num) => {
    return num.toFixed(2) // Fissa a 2 decimali
        .replace('.', ',') // Sostituisce il punto con la virgola
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Aggiunge punti come separatori delle migliaia
};

// Event listener per il submit del form
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impedisce il ricaricamento della pagina
    savingsTableDiv.innerHTML = ''; // Pulisce la tabella dei risparmi
    // Nasconde i pulsanti fino a quando non sono necessari
    calculateProfitsBtn.style.display = 'none';
    saveSavingsBtn.style.display = 'none';
    saveResultsBtn.style.display = 'none';
    saveAllBtn.style.display = 'none';

    // Raccolta dei valori dal form
    const startDate = new Date(document.getElementById('startDate').value); // Data di inizio
    const years = parseInt(document.getElementById('years').value); // Numero di anni inserito dall'utente
    const months = years * 12; // Conversione degli anni in mesi
    const initialBalance = parseFloat(document.getElementById('initialBalance').value); // Saldo iniziale
    const renewalMonths = parseInt(document.getElementById('renewalMonths').value); // Mesi per ogni rinnovo
    const monthlySavingsInput = document.getElementById('monthlySavings').value.trim(); // Input dei risparmi mensili
    const annualRate = parseFloat(document.getElementById('annualRate').value) / 100; // Tasso annuo in decimale

    // Parsing dei risparmi mensili: singolo valore o lista separata da virgole
    let monthlySavingsList;
    if (monthlySavingsInput.includes(',')) {
        monthlySavingsList = monthlySavingsInput.split(',').map(v => parseFloat(v.trim())); // Lista di valori
    } else {
        monthlySavingsList = [parseFloat(monthlySavingsInput)]; // Singolo valore
    }

    // Validazione degli input
    if (years < 1 || // Anni devono essere almeno 1
        initialBalance < 1000 || initialBalance > 10000000 || // Saldo tra 1000 e 10M
        renewalMonths < 1 || // Rinnovo deve essere positivo
        annualRate < 0 || // Tasso non negativo
        monthlySavingsList.some(v => v < 0 || isNaN(v)) || // Risparmi positivi e validi
        (monthlySavingsList.length > 1 && monthlySavingsList.length !== renewalMonths)) { // Lista deve corrispondere a renewalMonths
        savingsTableDiv.innerHTML = '<p>Errore: controlla i valori inseriti. Gli anni devono essere ≥ 1 e il numero di risparmi mensili deve essere 1 o uguale ai mesi per rinnovo.</p>';
        return; // Esce se la validazione fallisce
    }

    const startYear = startDate.getFullYear(); // Anno iniziale
    const startMonth = startDate.getMonth(); // Mese iniziale (0-11)
    const tableHTML = generateSavingsTable(startYear, startMonth, months, renewalMonths, monthlySavingsList); // Genera la tabella
    savingsTableDiv.innerHTML = tableHTML; // Mostra la tabella
    calculateProfitsBtn.style.display = 'block'; // Rende visibile il pulsante per calcolare i profitti
    saveSavingsBtn.style.display = 'block'; // Rende visibile il pulsante per salvare i risparmi

    // Associa le funzioni ai pulsanti
    calculateProfitsBtn.onclick = () => calculateProfits(startYear, startMonth, months, initialBalance, renewalMonths, annualRate);
    saveSavingsBtn.onclick = () => saveSavingsTable(startYear, startMonth, months);
});

// Funzione per generare la tabella dei risparmi
function generateSavingsTable(startYear, startMonth, months, renewalMonths, monthlySavingsList) {
    const endDate = new Date(startYear, startMonth + months, 1); // Data di fine
    const endYear = endDate.getFullYear(); // Anno finale
    const years = endYear - startYear + 1; // Numero di anni coperti dalla tabella

    let tableHTML = '<table><thead><tr><th></th>'; // Inizio della tabella HTML
    for (let y = 0; y < years; y++) {
        tableHTML += `<th>${startYear + y}</th>`; // Intestazione con gli anni
    }
    tableHTML += '</tr></thead><tbody>';

    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    for (let m = 0; m < 12; m++) { // Per ogni mese dell'anno
        tableHTML += `<tr><td>${monthNames[m]}</td>`; // Nome del mese
        for (let y = 0; y < years; y++) {
            const currentYear = startYear + y;
            const totalMonth = (currentYear - startYear) * 12 + m - startMonth; // Indice del mese rispetto all'inizio
            if (totalMonth >= 0 && totalMonth < months) { // Se il mese è entro la durata
                const isBeforeStart = (y === 0 && m < startMonth); // Controlla se è prima dell'inizio
                const savingsValue = isBeforeStart ? -1 : monthlySavingsList[totalMonth % monthlySavingsList.length]; // Valore ciclico
                tableHTML += `<td><input type="number" class="savings-input" data-year="${currentYear}" data-month="${m}" value="${savingsValue}" step="5" ${isBeforeStart ? 'disabled' : ''}></td>`;
            } else {
                tableHTML += '<td>-</td>'; // Cella vuota se fuori durata
            }
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    return tableHTML;
}

// Funzione asincrona per calcolare i profitti
async function calculateProfits(startYear, startMonth, months, initialBalance, renewalMonths, annualRate) {
    loader.classList.add('active'); // Mostra il caricamento
    resultsDiv.innerHTML = ''; // Pulisce i risultati precedenti
    saveResultsBtn.style.display = 'none';
    saveAllBtn.style.display = 'none';

    const savingsInputs = document.querySelectorAll('.savings-input'); // Raccoglie gli input della tabella
    const savingsList = [];
    savingsInputs.forEach(input => {
        if (!input.disabled) {
            savingsList.push(parseFloat(input.value)); // Aggiunge i valori modificabili
        }
    });

    if (savingsList.some(v => v < 0 || isNaN(v))) { // Controlla validità dei risparmi
        resultsDiv.innerHTML = '<p>Errore: i risparmi mensili devono essere numeri positivi.</p>';
        loader.classList.remove('active');
        return;
    }

    // Calcolo dei risparmi per ogni periodo di rinnovo
    const renewalSavingsList = [];
    for (let i = 0; i < savingsList.length; i += renewalMonths) {
        const chunk = savingsList.slice(i, i + renewalMonths); // Prende un blocco di mesi
        const sum = chunk.reduce((a, b) => a + b, 0); // Somma i risparmi del blocco
        renewalSavingsList.push(sum);
    }

    // Calcolo della media (solo per visualizzazione, non usata nei calcoli)
    const averageRenewalSavings = renewalSavingsList.reduce((a, b) => a + b, 0) / renewalSavingsList.length;

    await new Promise(resolve => setTimeout(resolve, 100)); // Breve ritardo per UX

    const years = months / 12; // Numero di anni dall'input
    const periodsPerYear = 12 / renewalMonths; // Numero di periodi in un anno
    const ratePerPeriodStandard = annualRate / periodsPerYear; // Tasso per periodo Standard
    const ratePerPeriodPremium = (annualRate + 0.001) / periodsPerYear; // Tasso per periodo Premium (+0,1%)
    const periodsTotal = Math.floor(months / renewalMonths); // Numero totale di periodi
    const premiumCost = 49.99; // Costo fisso annuale per Premium
    const taxRate = 0.26; // Aliquota fiscale sugli interessi

    const results = []; // Array per salvare i risultati di tutte le combinazioni
    const calculateInvestment = (combo) => { // Funzione per calcolare una singola combinazione
        let balance = initialBalance; // Saldo iniziale
        let totalPremiumCost = 0; // Costo totale Premium
        for (let year = 0; year < combo.length; year++) { // Per ogni anno
            const periodsLeft = Math.min(periodsPerYear, periodsTotal - year * periodsPerYear); // Periodi rimanenti nell'anno
            for (let p = 0; p < periodsLeft; p++) { // Per ogni periodo nell'anno
                const periodIndex = year * periodsPerYear + p; // Indice del periodo
                const rate = combo[year] === '0' ? ratePerPeriodStandard : ratePerPeriodPremium; // Scelta del tasso
                const interest = balance * rate; // Calcolo dell'interesse lordo
                const taxedInterest = interest * (1 - taxRate); // Interesse netto dopo tasse
                balance += taxedInterest + (renewalSavingsList[periodIndex] || 0); // Aggiorna il saldo
            }
            if (combo[year] === '1') { // Se l'anno è Premium
                totalPremiumCost += premiumCost; // Aggiunge il costo
                balance -= premiumCost; // Sottrae il costo dal saldo
            }
        }
        const totalSavings = renewalSavingsList.reduce((a, b) => a + b, 0); // Somma totale dei risparmi
        const finalGain = balance - initialBalance - totalSavings; // Guadagno netto
        return { combo, finalGain, finalBalance: balance, totalPremiumCost }; // Risultato della combinazione
    };

    // Generazione delle combinazioni
    if (months <= 240) { // Se la durata è ≤ 20 anni
        const allCombinations = [];
        for (let i = 0; i < 2 ** years; i++) {
            const combo = i.toString(2).padStart(years, '0'); // Genera tutte le combinazioni binarie
            allCombinations.push(combo);
        }
        allCombinations.forEach(combo => results.push(calculateInvestment(combo))); // Calcola ogni combinazione
    } else { // Per durate > 20 anni, calcolo approssimativo
        for (let i = 0; i <= years; i++) {
            results.push(calculateInvestment('0'.repeat(i) + '1'.repeat(years - i))); // Da tutto Standard a tutto Premium
        }
        for (let i = 1; i < years; i++) {
            results.push(calculateInvestment('1'.repeat(i) + '0'.repeat(years - i))); // Da tutto Premium a tutto Standard
        }
        resultsDiv.innerHTML += '<p>Nota: Per anni > 20 (240 mesi), il calcolo è meno preciso.</p>'; // Avviso
    }

    results.sort((a, b) => b.finalGain - a.finalGain); // Ordina per guadagno decrescente
    const top10 = results.slice(0, 10); // Prende le prime 10 combinazioni
    const allZeros = results.find(r => r.combo === '0'.repeat(years)); // Combinazione tutta Standard
    const allOnes = results.find(r => r.combo === '1'.repeat(years)); // Combinazione tutta Premium

    // Output HTML dei risultati
    const outputHTML = `
        <p>Anni: ${years}</p>
        <p>Mesi: ${months}</p>
        <p>Saldo iniziale: ${formatNumber(initialBalance)} €</p>
        <p>In media al rinnovo risparmi (solo a scopo informativo): ${formatNumber(averageRenewalSavings)} €</p>
        <p>Tasso lordo annuale: ${formatNumber(annualRate * 100)}%</p>
        <h3>Combinazione solo Standard (tutti 0):</h3>
        <pre>
Combinazione            ${allZeros.combo}
Guadagno finale         ${formatNumber(allZeros.finalGain)} €
Saldo finale            ${formatNumber(allZeros.finalBalance)} €
Costo Premium totale    ${formatNumber(allZeros.totalPremiumCost)} €
        </pre>
        <h3>Combinazione solo Premium (tutti 1):</h3>
        <pre>
Combinazione            ${allOnes.combo}
Guadagno finale         ${formatNumber(allOnes.finalGain)} €
Saldo finale            ${formatNumber(allOnes.finalBalance)} €
Costo Premium totale    ${formatNumber(allOnes.totalPremiumCost)} €
        </pre>
        <h3>I migliori 10 investimenti finali:</h3>
        <p>Nota: 0 = Standard, 1 = Premium</p>
        <table>
            <thead>
                <tr>
                    <th>Combinazione</th>
                    <th>Guadagno finale</th>
                    <th>Saldo finale</th>
                    <th>Costo Premium totale</th>
                </tr>
            </thead>
            <tbody>
                ${top10.map(r => `
                    <tr>
                        <td>${r.combo}</td>
                        <td>${formatNumber(r.finalGain)} €</td>
                        <td>${formatNumber(r.finalBalance)} €</td>
                        <td>${formatNumber(r.totalPremiumCost)} €</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p><strong>Nota Importante:</strong> <em>Questo programma è uno strumento di simulazione e può contenere errori o imprecisioni. Non è un sostituto di un consulente finanziario qualificato e non deve essere interpretato come un incentivo all'investimento. Si consiglia di consultare un professionista prima di prendere decisioni finanziarie.</em></p>
    `;
    resultsDiv.innerHTML = outputHTML;
    saveResultsBtn.style.display = 'block'; // Mostra pulsante per salvare i risultati
    saveAllBtn.style.display = 'block'; // Mostra pulsante per salvare tutto

    // Associa le funzioni ai pulsanti
    saveResultsBtn.onclick = () => saveResults(years, months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10);
    saveAllBtn.onclick = () => saveAllTables(startYear, startMonth, months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10);

    loader.classList.remove('active'); // Nasconde il caricamento
}

// Funzione per salvare la tabella dei risparmi in un file .txt
function saveSavingsTable(startYear, startMonth, months) {
    const savingsInputs = document.querySelectorAll('.savings-input');
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    const endDate = new Date(startYear, startMonth + months, 1);
    const endYear = endDate.getFullYear();
    const years = endYear - startYear + 1;

    const endMonth = endDate.getMonth();
    const startDateStr = `${monthNames[startMonth]} ${startYear}`;
    const endDateStr = `${monthNames[endMonth]} ${endYear}`;

    let textContent = `Tabella dei Risparmi\n`;
    textContent += `Durata: ${months} mesi (${years - 1} anni)\n`; // Durata in mesi e anni
    textContent += `Data di inizio: ${startDateStr}\n`;
    textContent += `Data di fine: ${endDateStr}\n\n`;
    textContent += `Risparmi Mensili:\n`;

    for (let y = 0; y < years; y++) {
        const currentYear = startYear + y;
        textContent += `- ${currentYear}:\n`;
        for (let m = 0; m < 12; m++) {
            const totalMonth = (currentYear - startYear) * 12 + m - startMonth;
            if (totalMonth >= 0 && totalMonth < months) {
                const input = document.querySelector(`.savings-input[data-year="${currentYear}"][data-month="${m}"]`);
                const savingsValue = input ? parseFloat(input.value) : 0;
                textContent += `  - ${monthNames[m]}: ${formatNumber(savingsValue)} €\n`; // Elenco dei risparmi
            }
        }
    }

    const blob = new Blob([textContent], { type: 'text/plain' }); // Crea il file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `risparmi-${startYear}-${months}.txt`; // Nome del file
    link.click(); // Avvia il download
}

// Funzione per salvare i risultati dei profitti in un file .txt
function saveResults(years, months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10) {
    const textContent = `
Calcolatore di Investimento
Anni: ${years}
Mesi: ${months}
Saldo iniziale: ${formatNumber(initialBalance)} €
In media al rinnovo risparmi (solo a scopo informativo): ${formatNumber(averageRenewalSavings)} €

Combinazione solo Standard (tutti 0):
Combinazione:            ${allZeros.combo}
Guadagno finale:         ${formatNumber(allZeros.finalGain)} €
Saldo finale:            ${formatNumber(allZeros.finalBalance)} €
Costo Premium totale:    ${formatNumber(allZeros.totalPremiumCost)} €

Combinazione solo Premium (tutti 1):
Combinazione:            ${allOnes.combo}
Guadagno finale:         ${formatNumber(allOnes.finalGain)} €
Saldo finale:            ${formatNumber(allOnes.finalBalance)} €
Costo Premium totale:    ${formatNumber(allOnes.totalPremiumCost)} €

I migliori 10 investimenti finali:
Nota: 0 = Standard, 1 = Premium
${'Combinazione'.padEnd(30)} Guadagno finale  Saldo finale  Costo Premium totale
${top10.map(r => `${r.combo.padEnd(30)} ${formatNumber(r.finalGain).padStart(15)} € ${formatNumber(r.finalBalance).padStart(12)} € ${formatNumber(r.totalPremiumCost).padStart(20)} €`).join('\n')}
    `;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `risultati-${months}-${initialBalance}.txt`;
    link.click();
}

// Funzione per salvare sia la tabella dei risparmi che i profitti in un unico file .txt
function saveAllTables(startYear, startMonth, months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10) {
    const savingsInputs = document.querySelectorAll('.savings-input');
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const endDate = new Date(startYear, startMonth + months, 1);
    const endYear = endDate.getFullYear();
    const years = months / 12; // Anni calcolati dai mesi totali

    const endMonth = endDate.getMonth();
    const startDateStr = `${monthNames[startMonth]} ${startYear}`;
    const endDateStr = `${monthNames[endMonth]} ${endYear}`;

    let textContent = `Calcolatore di Investimento Completo\n`;
    textContent += `Durata: ${months} mesi (${years} anni)\n`;
    textContent += `Data di inizio: ${startDateStr}\n`;
    textContent += `Data di fine: ${endDateStr}\n\n`;

    // Sezione dei profitti
    textContent += `Risultati dei Profitti\n`;
    textContent += `Anni: ${years}\n`;
    textContent += `Mesi: ${months}\n`;
    textContent += `Saldo iniziale: ${formatNumber(initialBalance)} €\n`;
    textContent += `In media al rinnovo risparmi (solo a scopo informativo): ${formatNumber(averageRenewalSavings)} €\n\n`;
    textContent += `Combinazione solo Standard (tutti 0):\n`;
    textContent += `Combinazione:            ${allZeros.combo}\n`;
    textContent += `Guadagno finale:         ${formatNumber(allZeros.finalGain)} €\n`;
    textContent += `Saldo finale:            ${formatNumber(allZeros.finalBalance)} €\n`;
    textContent += `Costo Premium totale:    ${formatNumber(allZeros.totalPremiumCost)} €\n\n`;
    textContent += `Combinazione solo Premium (tutti 1):\n`;
    textContent += `Combinazione:            ${allOnes.combo}\n`;
    textContent += `Guadagno finale:         ${formatNumber(allOnes.finalGain)} €\n`;
    textContent += `Saldo finale:            ${formatNumber(allOnes.finalBalance)} €\n`;
    textContent += `Costo Premium totale:    ${formatNumber(allOnes.totalPremiumCost)} €\n\n`;
    textContent += `I migliori 10 investimenti finali:\n`;
    textContent += `Nota: 0 = Standard, 1 = Premium\n`;
    textContent += `${'Combinazione'.padEnd(30)} Guadagno finale  Saldo finale  Costo Premium totale\n`;
    textContent += `${top10.map(r => `${r.combo.padEnd(30)} ${formatNumber(r.finalGain).padStart(15)} € ${formatNumber(r.finalBalance).padStart(12)} € ${formatNumber(r.totalPremiumCost).padStart(20)} €`).join('\n')}\n`;

    // Sezione dei risparmi
    textContent += `\nTabella dei Risparmi\n`;
    textContent += `Risparmi Mensili:\n`;
    for (let y = 0; y < years + 1; y++) { // +1 per includere l'anno finale parziale se presente
        const currentYear = startYear + y;
        textContent += `- ${currentYear}:\n`;
        for (let m = 0; m < 12; m++) {
            const totalMonth = (currentYear - startYear) * 12 + m - startMonth;
            if (totalMonth >= 0 && totalMonth < months) {
                const input = document.querySelector(`.savings-input[data-year="${currentYear}"][data-month="${m}"]`);
                const savingsValue = input ? parseFloat(input.value) : 0;
                textContent += `  - ${monthNames[m]}: ${formatNumber(savingsValue)} €\n`;
            }
        }
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `completo-${startYear}-${months}-${initialBalance}.txt`;
    link.click();
}