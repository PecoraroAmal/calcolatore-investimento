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

// Funzione per calcolare i giorni tra due date
const getDaysBetween = (startDate, endDate) => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((endDate - startDate) / oneDay);
};

// Funzione per aggiungere mesi a una data
const addMonths = (date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    savingsTableDiv.innerHTML = '';
    calculateProfitsBtn.style.display = 'none';
    saveSavingsBtn.style.display = 'none';
    saveResultsBtn.style.display = 'none';
    saveAllBtn.style.display = 'none';

    const startDate = new Date(document.getElementById('startDate').value);
    const years = parseInt(document.getElementById('years').value);
    const months = years * 12;
    const initialBalance = parseFloat(document.getElementById('initialBalance').value);
    const renewalMonths = parseInt(document.getElementById('renewalMonths').value);
    const monthlySavingsInput = document.getElementById('monthlySavings').value.trim();
    const annualRate = parseFloat(document.getElementById('annualRate').value) / 100;

    let monthlySavingsList;
    if (monthlySavingsInput.includes(',')) {
        monthlySavingsList = monthlySavingsInput.split(',').map(v => parseFloat(v.trim()));
    } else {
        monthlySavingsList = [parseFloat(monthlySavingsInput)];
    }

    if (years < 1 || initialBalance < 1000 || initialBalance > 10000000 || 
        renewalMonths < 1 || annualRate < 0 || 
        monthlySavingsList.some(v => v < 0 || isNaN(v)) || 
        (monthlySavingsList.length > 1 && monthlySavingsList.length !== renewalMonths)) {
        savingsTableDiv.innerHTML = '<p>Errore: controlla i valori inseriti.</p>';
        return;
    }

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const tableHTML = generateSavingsTable(startYear, startMonth, months, renewalMonths, monthlySavingsList);
    savingsTableDiv.innerHTML = tableHTML;
    calculateProfitsBtn.style.display = 'block';
    saveSavingsBtn.style.display = 'block';

    calculateProfitsBtn.onclick = () => calculateProfits(startDate, months, initialBalance, renewalMonths, annualRate);
    saveSavingsBtn.onclick = () => saveSavingsTable(startYear, startMonth, months);
});

function generateSavingsTable(startYear, startMonth, months, renewalMonths, monthlySavingsList) {
    const endDate = addMonths(new Date(startYear, startMonth, 1), months);
    const endYear = endDate.getFullYear();
    const years = endYear - startYear + 1;

    let tableHTML = '<table><thead><tr><th></th>';
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

async function calculateProfits(startDate, months, initialBalance, renewalPeriods, annualRate) {
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

    const renewalSavingsList = [];
    for (let i = 0; i < savingsList.length; i += renewalPeriods) {
        const chunk = savingsList.slice(i, i + renewalPeriods);
        const sum = chunk.reduce((a, b) => a + b, 0);
        renewalSavingsList.push(sum);
    }

    const averageRenewalSavings = renewalSavingsList.reduce((a, b) => a + b, 0) / renewalSavingsList.length;

    await new Promise(resolve => setTimeout(resolve, 100));

    const years = months / 12;
    const periodsTotal = Math.floor(months / renewalPeriods);
    const premiumCost = new Decimal('49.99');
    const taxRate = new Decimal('0.26');

    const renewalDates = [new Date(startDate)];
    for (let i = 1; i <= periodsTotal; i++) {
        renewalDates.push(addMonths(startDate, i * renewalPeriods));
    }
    const daysPerPeriod = [];
    for (let i = 0; i < periodsTotal; i++) {
        daysPerPeriod.push(getDaysBetween(renewalDates[i], renewalDates[i + 1]));
    }

    const results = [];
    const calculateInvestment = (combo) => {
        let balance = new Decimal(initialBalance);
        let totalPremiumCost = new Decimal(0);
        let totalGrossInterest = new Decimal(0);
        let totalNetInterest = new Decimal(0);

        for (let year = 0; year < combo.length; year++) {
            const periodsPerYear = 12 / renewalPeriods;
            const periodsLeft = Math.min(periodsPerYear, periodsTotal - year * periodsPerYear);
            for (let p = 0; p < periodsLeft; p++) {
                const periodIndex = year * periodsPerYear + p;
                const days = new Decimal(daysPerPeriod[periodIndex]);
                const rate = combo[year] === '0' ? new Decimal(annualRate) : new Decimal(annualRate).plus('0.001');
                const grossInterest = balance.times(rate).times(days).div(365).toDecimalPlaces(2);
                const netInterest = grossInterest.times(Decimal.sub(1, taxRate)).toDecimalPlaces(2);
                totalGrossInterest = totalGrossInterest.plus(grossInterest);
                totalNetInterest = totalNetInterest.plus(netInterest);
                balance = balance.plus(netInterest).plus(renewalSavingsList[periodIndex] || 0);
            }
            if (combo[year] === '1') {
                totalPremiumCost = totalPremiumCost.plus(premiumCost);
                balance = balance.minus(premiumCost);
            }
        }
        const totalSavings = renewalSavingsList.reduce((a, b) => a + b, 0);
        const finalGain = totalNetInterest.minus(totalPremiumCost);
        return { 
            combo, 
            finalGain: Number(finalGain.toFixed(2)), 
            finalBalance: Number(balance.toFixed(2)), 
            totalPremiumCost: Number(totalPremiumCost.toFixed(2)), 
            totalGrossInterest: Number(totalGrossInterest.toFixed(2)) 
        };
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
        resultsDiv.innerHTML += '<p>Nota: Per anni > 20 (240 mesi), il calcolo è meno preciso.</p>';
    }

    results.sort((a, b) => b.finalGain - a.finalGain);
    const top10 = results.slice(0, 10);
    const allZeros = results.find(r => r.combo === '0'.repeat(years));
    const allOnes = results.find(r => r.combo === '1'.repeat(years));

    const outputHTML = `
        <p>Anni: ${years}</p>
        <p>Mesi: ${months}</p>
        <p>Saldo iniziale: ${formatNumber(initialBalance)} €</p>
        <p>In media al rinnovo risparmi: ${formatNumber(averageRenewalSavings)} €</p>
        <p>Tasso lordo annuale: ${formatNumber(annualRate * 100)}%</p>
        <h3>Combinazione solo Standard (tutti 0):</h3>
        <pre>
Combinazione            ${allZeros.combo}
Interessi lordi totali  ${formatNumber(allZeros.totalGrossInterest)} €
Guadagno finale         ${formatNumber(allZeros.finalGain)} €
Saldo finale            ${formatNumber(allZeros.finalBalance)} €
Costo Premium totale    ${formatNumber(allZeros.totalPremiumCost)} €
        </pre>
        <h3>Combinazione solo Premium (tutti 1):</h3>
        <pre>
Combinazione            ${allOnes.combo}
Interessi lordi totali  ${formatNumber(allOnes.totalGrossInterest)} €
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
                    <th>Interessi lordi</th>
                    <th>Guadagno finale</th>
                    <th>Saldo finale</th>
                    <th>Costo Premium totale</th>
                </tr>
            </thead>
            <tbody>
                ${top10.map(r => `
                    <tr>
                        <td>${r.combo}</td>
                        <td>${formatNumber(r.totalGrossInterest)} €</td>
                        <td>${formatNumber(r.finalGain)} €</td>
                        <td>${formatNumber(r.finalBalance)} €</td>
                        <td>${formatNumber(r.totalPremiumCost)} €</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p><strong>Nota:</strong> <em>Simulazione approssimativa, consultare un professionista finanziario.</em></p>
    `;
    resultsDiv.innerHTML = outputHTML;
    saveResultsBtn.style.display = 'block';
    saveAllBtn.style.display = 'block';

    saveResultsBtn.onclick = () => saveResults(years, months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10);
    saveAllBtn.onclick = () => saveAllTables(startDate.getFullYear(), startDate.getMonth(), months, initialBalance, averageRenewalSavings, allZeros, allOnes, top10);

    loader.classList.remove('active');
}

function saveSavingsTable(startYear, startMonth, months) {
    const savingsInputs = document.querySelectorAll('.savings-input');
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    const endDate = addMonths(new Date(startYear, startMonth, 1), months);
    const endYear = endDate.getFullYear();
    const years = endYear - startYear + 1;

    const endMonth = endDate.getMonth();
    const startDateStr = `${monthNames[startMonth]} ${startYear}`;
    const endDateStr = `${monthNames[endMonth]} ${endYear}`;

    let textContent = `Tabella dei Risparmi\n`;
    textContent += `Durata: ${months} mesi (${years - 1} anni)\n`;
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
In media al rinnovo risparmi: ${formatNumber(averageRenewalSavings)} €

Combinazione solo Standard (tutti 0):
Combinazione:            ${allZeros.combo}
Interessi lordi totali:  ${formatNumber(allZeros.totalGrossInterest)} €
Guadagno finale:         ${formatNumber(allZeros.finalGain)} €
Saldo finale:            ${formatNumber(allZeros.finalBalance)} €
Costo Premium totale:    ${formatNumber(allZeros.totalPremiumCost)} €

Combinazione solo Premium (tutti 1):
Combinazione:            ${allOnes.combo}
Interessi lordi totali:  ${formatNumber(allOnes.totalGrossInterest)} €
Guadagno finale:         ${formatNumber(allOnes.finalGain)} €
Saldo finale:            ${formatNumber(allOnes.finalBalance)} €
Costo Premium totale:    ${formatNumber(allOnes.totalPremiumCost)} €

I migliori 10 investimenti finali:
Nota: 0 = Standard, 1 = Premium
${'Combinazione'.padEnd(30)} Interessi lordi Guadagno finale  Saldo finale  Costo Premium totale
${top10.map(r => `${r.combo.padEnd(30)} ${formatNumber(r.totalGrossInterest).padStart(15)} € ${formatNumber(r.finalGain).padStart(15)} € ${formatNumber(r.finalBalance).padStart(12)} € ${formatNumber(r.totalPremiumCost).padStart(20)} €`).join('\n')}
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
    const endDate = addMonths(new Date(startYear, startMonth, 1), months);
    const endYear = endDate.getFullYear();
    const years = months / 12;

    const endMonth = endDate.getMonth();
    const startDateStr = `${monthNames[startMonth]} ${startYear}`;
    const endDateStr = `${monthNames[endMonth]} ${endYear}`;

    let textContent = `Calcolatore di Investimento Completo\n`;
    textContent += `Durata: ${months} mesi (${years} anni)\n`;
    textContent += `Data di inizio: ${startDateStr}\n`;
    textContent += `Data di fine: ${endDateStr}\n\n`;

    textContent += `Risultati dei Profitti\n`;
    textContent += `Anni: ${years}\n`;
    textContent += `Mesi: ${months}\n`;
    textContent += `Saldo iniziale: ${formatNumber(initialBalance)} €\n`;
    textContent += `In media al rinnovo risparmi: ${formatNumber(averageRenewalSavings)} €\n\n`;
    textContent += `Combinazione solo Standard (tutti 0):\n`;
    textContent += `Combinazione:            ${allZeros.combo}\n`;
    textContent += `Interessi lordi totali:  ${formatNumber(allZeros.totalGrossInterest)} €\n`;
    textContent += `Guadagno finale:         ${formatNumber(allZeros.finalGain)} €\n`;
    textContent += `Saldo finale:            ${formatNumber(allZeros.finalBalance)} €\n`;
    textContent += `Costo Premium totale:    ${formatNumber(allZeros.totalPremiumCost)} €\n\n`;
    textContent += `Combinazione solo Premium (tutti 1):\n`;
    textContent += `Combinazione:            ${allOnes.combo}\n`;
    textContent += `Interessi lordi totali:  ${formatNumber(allOnes.totalGrossInterest)} €\n`;
    textContent += `Guadagno finale:         ${formatNumber(allOnes.finalGain)} €\n`;
    textContent += `Saldo finale:            ${formatNumber(allOnes.finalBalance)} €\n`;
    textContent += `Costo Premium totale:    ${formatNumber(allOnes.totalPremiumCost)} €\n\n`;
    textContent += `I migliori 10 investimenti finali:\n`;
    textContent += `Nota: 0 = Standard, 1 = Premium\n`;
    textContent += `${'Combinazione'.padEnd(30)} Interessi lordi Guadagno finale  Saldo finale  Costo Premium totale\n`;
    textContent += `${top10.map(r => `${r.combo.padEnd(30)} ${formatNumber(r.totalGrossInterest).padStart(15)} € ${formatNumber(r.finalGain).padStart(15)} € ${formatNumber(r.finalBalance).padStart(12)} € ${formatNumber(r.totalPremiumCost).padStart(20)} €`).join('\n')}\n`;

    textContent += `\nTabella dei Risparmi\n`;
    textContent += `Risparmi Mensili:\n`;
    for (let y = 0; y < years + 1; y++) {
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