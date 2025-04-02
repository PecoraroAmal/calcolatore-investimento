function formatNumber(num) {
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

document.getElementById('calcForm').addEventListener('submit', function(event) {
    event.preventDefault();
    generateTable();
});

function generateTable() {
    const years = parseInt(document.getElementById('calcYears').value);
    const renewalMonths = parseInt(document.getElementById('calcRenewalMonths').value);
    const monthlySavingsInput = document.getElementById('calcMonthlySavings').value.split(',').map(s => parseFloat(s.trim()));
    const months = years * 12; // Totale mesi (es. 24 per 2 anni)
    const startDate = new Date(document.getElementById('calcStartDate').value);
    const startMonth = startDate.getMonth(); // Mese iniziale (0-11)
    const startYear = startDate.getFullYear(); // Anno iniziale

    if (monthlySavingsInput.length !== 1 && monthlySavingsInput.length !== renewalMonths) {
        alert('Il numero di risparmi mensili deve essere un solo numero oppure uguale al numero di mesi per rinnovo.');
        return;
    }

    // Popola savingsList con i risparmi mensili
    let savingsList = new Array(months).fill(0);
    let cycleIndex = 0;
    for (let i = 0; i < months; i++) {
        savingsList[i] = monthlySavingsInput[cycleIndex % monthlySavingsInput.length];
        cycleIndex++;
    }

    // Calcola la data di fine
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months); // Aggiunge il numero totale di mesi
    const endYear = endDate.getFullYear();
    const totalYears = endYear - startYear + 1; // Numero di anni coperti (parziali o completi)

    // Genera l'intestazione della tabella con gli anni effettivi
    let tableHTML = '<table><tr><th>Mese</th>';
    for (let year = 0; year < totalYears; year++) {
        const currentYear = startYear + year;
        tableHTML += `<th>${currentYear} (${year + 1}°)</th>`;
    }
    tableHTML += '</tr>';

    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    // Genera le righe della tabella per i 12 mesi
    for (let month = 0; month < 12; month++) {
        tableHTML += `<tr><td>${monthNames[month]}</td>`;
        for (let year = 0; year < totalYears; year++) {
            const currentYear = startYear + year;
            const monthIndex = (currentYear - startYear) * 12 + month - startMonth;
            if (monthIndex >= 0 && monthIndex < months) {
                tableHTML += `<td><input type="number" value="${savingsList[monthIndex]}" step="10" onchange="updateSavings(${monthIndex}, this.value)"></td>`;
            } else {
                tableHTML += '<td>-</td>';
            }
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</table>';

    document.getElementById('savingsTableContainer').innerHTML = tableHTML;
    document.getElementById('generateProfitsBtn').style.display = 'block';
    window.savingsList = savingsList;
}

function updateSavings(index, value) {
    window.savingsList[index] = parseFloat(value);
}

function calculateProfits() {
    document.getElementById('loading').style.display = 'block';
    setTimeout(() => {
        const initialBalance = parseFloat(document.getElementById('calcInitialBalance').value);
        const years = parseInt(document.getElementById('calcYears').value);
        const renewalMonths = parseInt(document.getElementById('calcRenewalMonths').value);
        const annualRate = parseFloat(document.getElementById('calcAnnualRate').value) / 100;
        const periodsPerYear = 12 / renewalMonths;
        const totalPeriods = Math.floor((years * 12) / renewalMonths);
        const standardRate = annualRate / periodsPerYear;
        const premiumIncrement = renewalMonths === 6 ? 0.005 : 0.002;
        const premiumRate = (annualRate + premiumIncrement) / periodsPerYear;
        const premiumCost = 49.99;
        const startDate = new Date(document.getElementById('calcStartDate').value);
        const monthlySavingsInput = document.getElementById('calcMonthlySavings').value;
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const months = years * 12;
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);
        const endYear = endDate.getFullYear();
        const totalYears = endYear - startYear + 1;

        let renewalSavingsList = [];
        for (let i = 0; i < totalPeriods; i++) {
            let sum = 0;
            for (let j = 0; j < renewalMonths; j++) {
                sum += window.savingsList[i * renewalMonths + j] || 0;
            }
            renewalSavingsList.push(sum);
        }

        function calculateReturn(combination) {
            let balance = initialBalance;
            let totalPremiumCost = 0;
            for (let i = 0; i < totalPeriods; i++) {
                const yearIndex = Math.floor(i / periodsPerYear);
                const isPremium = combination[yearIndex] === '1';
                const rate = isPremium ? premiumRate : standardRate;
                const interest = balance * rate;
                const netInterest = interest * (1 - 0.26);
                balance += netInterest + renewalSavingsList[i];
                if (isPremium && i % periodsPerYear === 0) {
                    balance -= premiumCost;
                    totalPremiumCost += premiumCost;
                }
            }
            const totalSavings = renewalSavingsList.reduce((a, b) => a + b, 0);
            return {
                combination: combination,
                finalBalance: balance,
                finalGain: balance - initialBalance - totalSavings,
                totalSavings: totalSavings,
                totalPremiumCost: totalPremiumCost
            };
        }

        let results = [];
        if (years <= 20) {
            for (let i = 0; i < Math.pow(2, years); i++) {
                const combination = i.toString(2).padStart(years, '0');
                results.push(calculateReturn(combination));
            }
        } else {
            for (let i = 0; i <= years; i++) {
                const zerosThenOnes = '0'.repeat(i) + '1'.repeat(years - i);
                results.push(calculateReturn(zerosThenOnes));
                if (i > 0 && i < years) {
                    const onesThenZeros = '1'.repeat(i) + '0'.repeat(years - i);
                    results.push(calculateReturn(onesThenZeros));
                }
            }
            alert('Per anni > 20, vengono calcolate solo le combinazioni con sequenze di 0 seguite da 1 e viceversa.');
        }

        results.sort((a, b) => b.finalGain - a.finalGain);
        const top10 = results.slice(0, 10);
        const allStandard = results.find(r => r.combination === '0'.repeat(years));
        const allPremium = results.find(r => r.combination === '1'.repeat(years));

        // Genera la tabella dei risparmi per i "Dati Inseriti"
        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                           'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        let savingsTableText = 'Tabella dei Risparmi:<br>Mese<br>';
        for (let year = 0; year < totalYears; year++) {
            const currentYear = startYear + year;
            savingsTableText += `${currentYear} (${year + 1}°)<br>`;
        }
        savingsTableText += '<br>';
        for (let month = 0; month < 12; month++) {
            savingsTableText += `${monthNames[month]}<br>`;
            for (let year = 0; year < totalYears; year++) {
                const currentYear = startYear + year;
                const monthIndex = (currentYear - startYear) * 12 + month - startMonth;
                if (monthIndex >= 0 && monthIndex < months) {
                    savingsTableText += `${formatNumber(window.savingsList[monthIndex])}<br>`;
                } else {
                    savingsTableText += '-<br>';
                }
            }
            savingsTableText += '<br>';
        }

        let resultsHTML = `
            <h2>Risultati</h2>
            <p><strong>Dati Inseriti:</strong><br>
                Data di Inizio: ${startDate.toLocaleDateString('it-IT')}<br>
                Anni: ${years}<br>
                Saldo Iniziale: ${formatNumber(initialBalance)} €<br>
                Mesi per Rinnovo: ${renewalMonths}<br>
                Risparmio Mensile Iniziale: ${monthlySavingsInput}<br>
            <p><strong>Tutto Standard:</strong><br>Saldo Finale: ${formatNumber(allStandard.finalBalance)} €<br>Guadagno: ${formatNumber(allStandard.finalGain)} € <br> Tasso Lordo Annuale: ${formatNumber(annualRate * 100)} %<br></p>
            <p><strong>Tutto Premium:</strong><br>Saldo Finale: ${formatNumber(allPremium.finalBalance)} €<br>Guadagno: ${formatNumber(allPremium.finalGain)} €<br>Costo Premium: ${formatNumber(allPremium.totalPremiumCost)} € <br> Tasso Lordo Annuale: ${formatNumber((annualRate + premiumIncrement) * 100)} %<br></p>
            <h3>Top 10 Combinazioni</h3>
            <p>Standard = 0, Premium = 1</p>
            <table>
                <tr><th>Combinazione</th><th>Saldo Finale (€)</th><th>Guadagno Finale (€)</th><th>Costo Premium (€)</th></tr>`;
        top10.forEach(r => {
            resultsHTML += `<tr><td>${r.combination}</td><td>${formatNumber(r.finalBalance)}</td><td>${formatNumber(r.finalGain)}</td><td>${formatNumber(r.totalPremiumCost)}</td></tr>`;
        });
        resultsHTML += `</table>
            <p><strong>Nota Importante:</strong> <em>Questo programma è uno strumento di simulazione e può contenere errori o imprecisioni. Non è un sostituto di un consulente finanziario qualificato e non deve essere interpretato come un incentivo all'investimento. Si consiglia di consultare un professionista prima di prendere decisioni finanziarie.</em></p>`;

        document.getElementById('resultsContainer').innerHTML = resultsHTML;
        document.getElementById('exportButtons').style.display = 'flex';
        document.getElementById('loading').style.display = 'none';
    }, 100);
}

function exportSavings() {
    const years = parseInt(document.getElementById('calcYears').value);
    const months = years * 12;
    const startDate = new Date(document.getElementById('calcStartDate').value);
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    let text = 'Mese\t';
    for (let year = 0; year < years; year++) {
        text += `${startYear + year} (${year + 1}°) \t`;
    }
    text += '\n';

    for (let month = 0; month < 12; month++) {
        text += `${monthNames[month]}\t`;
        for (let year = 0; year < years; year++) {
            const index = year * 12 + month;
            if (index < months) {
                if (year === 0 && month < startMonth) {
                    text += '-\t';
                } else {
                    text += `${formatNumber(window.savingsList[index])}\t`;
                }
            } else {
                text += '-\t';
            }
        }
        text += '\n';
    }

    download('tabella_risparmi.txt', text);
}

function exportResults() {
    const results = document.getElementById('resultsContainer').innerText;
    download('tabella_profitti.txt', results);
}

function exportAll() {
    const years = parseInt(document.getElementById('calcYears').value);
    const months = years * 12;
    const startDate = new Date(document.getElementById('calcStartDate').value);
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    let savingsText = 'Tabella Risparmi\nMese\t';
    for (let year = 0; year < years; year++) {
        savingsText += `Anno ${year + 1} (${startYear + year})\t`;
    }
    savingsText += '\n';

    for (let month = 0; month < 12; month++) {
        savingsText += `${monthNames[month]}\t`;
        for (let year = 0; year < years; year++) {
            const index = year * 12 + month;
            if (index < months) {
                if (year === 0 && month < startMonth) {
                    savingsText += '-\t';
                } else {
                    savingsText += `${formatNumber(window.savingsList[index])}\t`;
                }
            } else {
                savingsText += '-\t';
            }
        }
        savingsText += '\n';
    }

    const resultsText = document.getElementById('resultsContainer').innerText;
    download('profitti_e_risparmi.txt', `${savingsText}\n\nRisultati:\n${resultsText}`);
}

function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}