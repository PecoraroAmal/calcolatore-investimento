const form = document.getElementById('investmentForm');
const loader = document.getElementById('loader');
const resultsDiv = document.getElementById('results');

// Funzione per formattare i numeri con virgola e migliaia separate da punto
const formatNumber = (num) => {
    return num.toFixed(2) // Arrotonda a 2 decimali
        .replace('.', ',') // Sostituisci il punto con la virgola per i decimali
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Aggiungi il punto per le migliaia
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    loader.classList.add('active');
    resultsDiv.innerHTML = ''; // Pulisci i risultati precedenti

    // Input values
    const months = parseInt(document.getElementById('months').value);
    const initialBalance = parseFloat(document.getElementById('initialBalance').value);
    const monthlySavings = parseFloat(document.getElementById('monthlySavings').value);
    const renewalMonths = parseInt(document.getElementById('renewalMonths').value);
    const annualRate = parseFloat(document.getElementById('annualRate').value) / 100;

    // Validation
    if (months % 12 !== 0 || initialBalance < 1000 || initialBalance > 10000000 || monthlySavings < 0 || renewalMonths <= 0 || annualRate < 0) {
        resultsDiv.innerHTML = '<p>Errore: controlla i valori inseriti.</p>';
        loader.classList.remove('active');
        return;
    }

    // Simula un ritardo per mostrare lo spinner
    await new Promise(resolve => setTimeout(resolve, 100));

    const renewalBalance = monthlySavings * renewalMonths;
    const years = Math.ceil(months / 12);
    const periodsPerYear = 12 / renewalMonths; // Numero di rinnovi all'anno
    const ratePerPeriodStandard = annualRate / periodsPerYear; // Tasso per periodo Standard
    const ratePerPeriodPremium = (annualRate + 0.001) / periodsPerYear; // Tasso per periodo Premium (+0.1%)
    const periodsTotal = Math.floor(months / renewalMonths); // Numero totale di periodi
    const premiumCost = 49.99;
    const taxRate = 0.26;

    const results = [];
    const calculateInvestment = (combo) => {
        let balance = initialBalance;
        let totalPremiumCost = 0;
        for (let year = 0; year < combo.length; year++) {
            const periodsLeft = Math.min(periodsPerYear, Math.ceil((months - year * 12) / renewalMonths));
            for (let p = 0; p < periodsLeft; p++) {
                const rate = combo[year] === '0' ? ratePerPeriodStandard : ratePerPeriodPremium;
                const interest = balance * rate;
                const taxedInterest = interest * (1 - taxRate);
                balance += taxedInterest + renewalBalance;
            }
            if (combo[year] === '1') {
                totalPremiumCost += premiumCost;
                balance -= premiumCost;
            }
        }
        const finalGain = balance - initialBalance - (renewalBalance * periodsTotal);
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

    // Sort and select top 10
    results.sort((a, b) => b.finalGain - a.finalGain);
    const top10 = results.slice(0, 10);
    const allZeros = results.find(r => r.combo === '0'.repeat(years));
    const allOnes = results.find(r => r.combo === '1'.repeat(years));

    // Generate output
    const outputHTML = `
        <p>Anni: ${months / 12}</p>
        <p>Mesi: ${months}</p>
        <p>Saldo iniziale: ${formatNumber(initialBalance)} €</p>
        <p>Saldo aggiunto al rinnovo: ${formatNumber(renewalBalance)} €</p>
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
                        <td>${formatNumber(r.finalGain)}€</td>
                        <td>${formatNumber(r.finalBalance)}€</td>
                        <td>${formatNumber(r.totalPremiumCost)}€</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <button class="save-button" onclick="saveResults()">Salva Risultati</button>
    `;
    resultsDiv.innerHTML = outputHTML;

    // Save function
    window.saveResults = () => {
        const textContent = `
Calcolatore di Investimento
Anni: ${months / 12}
Mesi: ${months}
Saldo iniziale: ${formatNumber(initialBalance)}
Saldo aggiunto al rinnovo: ${formatNumber(renewalBalance)}

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
        link.download = `risultati-${months}-${initialBalance}-${renewalBalance}.txt`;
        link.click();
    };

    loader.classList.remove('active');
});