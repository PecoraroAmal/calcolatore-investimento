const form = document.getElementById('investmentForm');
const loader = document.getElementById('loader');
const resultsDiv = document.getElementById('results');
const savingsTableDiv = document.getElementById('savingsTable');
const calculateProfitsBtn = document.getElementById('calculateProfits');
const saveSavingsBtn = document.getElementById('saveSavings');
const saveResultsBtn = document.getElementById('saveResultsBtn');
const saveAllBtn = document.getElementById('saveAll');

const formatNumber = (num) => {
    return num.toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    savingsTableDiv.innerHTML = '';
    calculateProfitsBtn.style.display = 'none';
    saveSavingsBtn.style.display = 'none';
    saveResultsBtn.style.display = 'none';
    saveAllBtn.style.display = 'none';

    const startDate = new Date(document.getElementById('startDate').value);
    const months = parseInt(document.getElementById('months').value);
    const initialBalance = parseFloat(document.getElementById('initialBalance').value);
    const renewalMonths = parseInt(document.getElementById('renewalMonths').value);
    const monthlySavingsInput = document.getElementById('monthlySavings').value.trim();
    const annualRate = parseFloat(document.getElementById('annualRate').value) / 100;

    // Parsing del risparmio mensile
    let monthlySavingsList;
    if (monthlySavingsInput.includes(',')) {
        monthlySavingsList = monthlySavingsInput.split(',').map(v => parseFloat(v.trim()));
    } else {
        monthlySavingsList = [parseFloat(monthlySavingsInput)];
    }

    // Validazione
    if (months % 12 !== 0 || months < 12 || initialBalance < 1000 || initialBalance > 10000000 || 
        renewalMonths < 1 || annualRate < 0 || 
        monthlySavingsList.some(v => v < 0 || isNaN(v)) || 
        (monthlySavingsList.length > 1 && monthlySavingsList.length !== renewalMonths)) {
        savingsTableDiv.innerHTML = '<p>Errore: controlla i valori inseriti. Il numero di risparmi mensili deve essere 1 o uguale ai mesi per rinnovo.</p>';
        return;
    }

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const tableHTML = generateSavingsTable(startYear, startMonth, months, renewalMonths, monthlySavingsList);
    savingsTableDiv.innerHTML = tableHTML;
    calculateProfitsBtn.style.display = 'block';
    saveSavingsBtn.style.display = 'block';

    calculateProfitsBtn.onclick = () => calculateProfits(startYear, startMonth, months, initialBalance, renewalMonths, annualRate);
    saveSavingsBtn.onclick = () => saveSavingsTable(startYear, startMonth, months);
});

function generateSavingsTable(startYear, startMonth, months, renewalMonths, monthlySavingsList) {
    const endDate = new Date(startYear, startMonth + months, 1);
    const endYear = endDate.getFullYear();
    const years = endYear - startYear + 1;
    let tableHTML = '<h2>Tabella dei Risparmi Mensili</h2>';
    tableHTML += '<table><thead><tr><th></th>';
    for (let y = 0; y < years; y++) {
        tableHTML += `<th>${startYear + y}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';

    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    for (let m = 0; m < 12; m++) {
        tableHTML += `<tr><td>${monthNames[m]}</td>`;
        for (let y = 0; y < years; y++) {
            const currentYear = startYear + y;
            const totalMonth = (currentYear - startYear) * 12 + m - startMonth;
            if (totalMonth >= 0 && totalMonth < months) {
                const isBeforeStart = (y === 0 && m < startMonth);
                const savingsValue = isBeforeStart ? -1 : monthlySavingsList[totalMonth % monthlySavingsList.length];
                tableHTML += `<td><input type="number" class="savings-input" data-year="${currentYear}" data-month="${m}" value="${savingsValue}" step="5" ${isBeforeStart ? 'disabled' : ''}></td>`;
            } else {
                tableHTML += '<td>-</td>';
            }
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    return tableHTML;
}

async function calculateProfits(startYear, startMonth, months, initialBalance, renewalMonths, annualRate) {
    loader.classList.add('active');
    resultsDiv.innerHTML = '';
    saveResultsBtn.style.display = 'none';
    saveAllBtn.style.display = 'none';

    const savingsInputs = document.querySelectorAll('.savings-input');
    const savingsList = [];
    savingsInputs.forEach(input => {
        if (!input.disabled) {
            savingsList.push(parseFloat(input.value));
        }
    });

    if (savingsList.some(v => v < 0 || isNaN(v))) {
        resultsDiv.innerHTML = '<p>Errore: i risparmi mensili devono essere numeri positivi.</p>';
        loader.classList.remove('active');
        return;
    }

    // Calcolo del saldo aggiunto al rinnovo per ogni periodo
    const renewalSavingsList = [];
    for (let i = 0; i < savingsList.length; i += renewalMonths) {
        const chunk = savingsList.slice(i, i + renewalMonths);
        const sum = chunk.reduce((a, b) => a + b, 0);
        renewalSavingsList.push(sum);
    }

    // Media solo per visualizzazione, non usata nei calcoli
    const averageRenewalSavings = renewalSavingsList.reduce((a, b) => a + b, 0) / renewalSavingsList.length;

    await new Promise(resolve => setTimeout(resolve, 100));

    const years = Math.ceil(months / 12);
    const periodsPerYear = 12 / renewalMonths;
    const ratePerPeriodStandard = annualRate / periodsPerYear;
    const ratePerPeriodPremium = (annualRate + 0.001) / periodsPerYear;
    const periodsTotal = Math.floor(months / renewalMonths);
    const premiumCost = 49.99;
    const taxRate = 0.26;

    const results = [];
    const calculateInvestment = (combo) => {
        let balance = initialBalance;
        let totalPremiumCost = 0;
        for (let year = 0; year < combo.length; year++) {
            const periodsLeft = Math.min(periodsPerYear, periodsTotal - year * periodsPerYear);
            for (let p = 0; p < periodsLeft; p++) {
                const periodIndex = year * periodsPerYear + p;
                const rate = combo[year] === '0' ? ratePerPeriodStandard : ratePerPeriodPremium;
                const interest = balance * rate;
                const taxedInterest = interest * (1 - taxRate);
                balance += taxedInterest + (renewalSavingsList[periodIndex] || 0);
            }
            if (combo[year] === '1') {
                totalPremiumCost += premiumCost;
                balance -= premiumCost;
            }
        }
        const totalSavings = renewalSavingsList.reduce((a, b) => a + b, 0);
        const finalGain = balance - initialBalance - totalSavings;
        return { combo, finalGain, finalBalance: balance, totalPremiumCost };
    };

    if (months <= 240) {
        const allCombinations = [];
        for (let i = 0; i < 2 ** years; i++) {
            const combo = i.toString(2).padStart(years, '0');
            allCombinations.push(combo);
        }
        allCombinations.forEach(combo => results.push(calculateInvestment(combo)));
    } else {
        for (let i = 0; i <= years; i++) {
            results.push(calculateInvestment('0'.repeat(i) + '1'.repeat(years - i)));
        }
        for (let i = 1; i < years; i++) {
            results.push(calculateInvestment('1'.repeat(i) + '0'.repeat(years - i)));
        }
        resultsDiv.innerHTML += '<p>Nota: Per mesi > 240, il calcolo è meno preciso.</p>';
    }

    results.sort((a, b) => b.finalGain - a.finalGain);
    const top10 = results.slice(0, 10);
    const allZeros = results.find(r => r.combo === '0'.repeat(years));
    const allOnes = results.find(r => r.combo === '1'.repeat(years));

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
    saveResultsBtn.style.display = 'block';
    saveAllBtn.style.display = 'block';

    saveResultsBtn.onclick = () => saveResults(years, months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10);
    saveAllBtn.onclick = () => saveAllTables(startYear, startMonth, months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10);

    loader.classList.remove('active');
}

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
    textContent += `Durata: ${months} mesi (${years} anni)\n`;
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
                textContent += `  - ${monthNames[m]}: ${formatNumber(savingsValue)} €\n`;
            }
        }
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `risparmi-${startYear}-${months}.txt`;
    link.click();
}

function saveResults(years, months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10) {
    const textContent = `
Calcolatore di Investimento
Anni: ${years}
Mesi: ${months}
Saldo iniziale: ${formatNumber(initialBalance)} €
In media al rinnovo risparmi (solo a scopo informativo): ${formatNumber(averageRenewalSavings)} €
Combinazione solo Standard (tutti 0):
Combinazione            ${allZeros.combo}
Guadagno finale         ${formatNumber(allZeros.finalGain)}
Saldo finale            ${formatNumber(allZeros.finalBalance)}
Costo Premium totale    ${formatNumber(allZeros.totalPremiumCost)}

Combinazione solo Premium (tutti 1):
Combinazione            ${allOnes.combo}
Guadagno finale         ${formatNumber(allOnes.finalGain)}
Saldo finale            ${formatNumber(allOnes.finalBalance)}
Costo Premium totale    ${formatNumber(allOnes.totalPremiumCost)}

I migliori 10 investimenti finali:
Nota: 0 = Standard, 1 = Premium
${'Combinazione'.padEnd(30)} Guadagno finale  Saldo finale  Costo Premium totale
${top10.map(r => `${r.combo.padEnd(30)} ${formatNumber(r.finalGain).padStart(15)} ${formatNumber(r.finalBalance).padStart(12)} ${formatNumber(r.totalPremiumCost).padStart(20)}`).join('\n')}
    `;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `risultati-${months}-${initialBalance}.txt`;
    link.click();
}

function saveAllTables(startYear, startMonth, months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10) {
    const savingsInputs = document.querySelectorAll('.savings-input');
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const endDate = new Date(startYear, startMonth + months, 1);
    const endYear = endDate.getFullYear();
    const years = endYear - startYear + 1;

    const endMonth = endDate.getMonth();
    const startDateStr = `${monthNames[startMonth]} ${startYear}`;
    const endDateStr = `${monthNames[endMonth]} ${endYear}`;

    let textContent = `Calcolatore di Investimento Completo\n`;
    textContent += `Durata: ${months} mesi (${years} anni)\n`;
    textContent += `Data di inizio: ${startDateStr}\n`;
    textContent += `Data di fine: ${endDateStr}\n\n`;

    // Risultati dei Profitti
    textContent += `Risultati dei Profitti\n`;
    textContent += `Anni: ${years}\n`;
    textContent += `Mesi: ${months}\n`;
    textContent += `Saldo iniziale: ${formatNumber(initialBalance)} €\n`;
    textContent += `In media al rinnovo risparmi (solo a scopo informativo): ${formatNumber(averageRenewalSavings)} €\n\n`;
    textContent += `Combinazione solo Standard (tutti 0):\n`;
    textContent += `Combinazione            ${allZeros.combo}\n`;
    textContent += `Guadagno finale         ${formatNumber(allZeros.finalGain)}\n`;
    textContent += `Saldo finale            ${formatNumber(allZeros.finalBalance)}\n`;
    textContent += `Costo Premium totale    ${formatNumber(allZeros.totalPremiumCost)}\n\n`;
    textContent += `Combinazione solo Premium (tutti 1):\n`;
    textContent += `Combinazione            ${allOnes.combo}\n`;
    textContent += `Guadagno finale         ${formatNumber(allOnes.finalGain)}\n`;
    textContent += `Saldo finale            ${formatNumber(allOnes.finalBalance)}\n`;
    textContent += `Costo Premium totale    ${formatNumber(allOnes.totalPremiumCost)}\n\n`;
    textContent += `I migliori 10 investimenti finali:\n`;
    textContent += `Nota: 0 = Standard, 1 = Premium\n`;
    textContent += `${'Combinazione'.padEnd(30)} Guadagno finale  Saldo finale  Costo Premium totale\n`;
    textContent += `${top10.map(r => `${r.combo.padEnd(30)} ${formatNumber(r.finalGain).padStart(15)} ${formatNumber(r.finalBalance).padStart(12)} ${formatNumber(r.totalPremiumCost).padStart(20)}`).join('\n')}\n`;

    // Tabella dei Risparmi
    textContent += `\nTabella dei Risparmi\n`;
    textContent += `Risparmi Mensili:\n`;
    for (let y = 0; y < years; y++) {
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