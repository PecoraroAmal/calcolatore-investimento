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
        // Modifica: incremento del tasso Premium in base a renewalMonths
        const premiumIncrement = renewalMonths === 6 ? 0.005 : 0.002; // 0,5% se 6 mesi, altrimenti 0,2%
        const premiumRate = (annualRate + premiumIncrement) / periodsPerYear;
        const premiumCost = 49.99;
        const startDate = new Date(document.getElementById('calcStartDate').value);
        const monthlySavingsInput = document.getElementById('calcMonthlySavings').value;

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

        let resultsHTML = `
            <h2>Risultati</h2>
            <p><strong>Dati Inseriti:</strong><br>
                Data di Inizio: ${startDate.toLocaleDateString('it-IT')}<br>
                Anni: ${years}<br>
                Saldo Iniziale: ${formatNumber(initialBalance)} €<br>
                Mesi per Rinnovo: ${renewalMonths}<br>
                Risparmio Mensile: ${monthlySavingsInput}<br>
                Tasso Lordo Annuale: ${formatNumber(annualRate * 100)} %<br>
                Incremento Premium: ${formatNumber(premiumIncrement * 100)} %</p>
            <p><strong>Tutto Standard:</strong><br>Saldo Finale: ${formatNumber(allStandard.finalBalance)} €<br>Guadagno: ${formatNumber(allStandard.finalGain)} €</p>
            <p><strong>Tutto Premium:</strong><br>Saldo Finale: ${formatNumber(allPremium.finalBalance)} €<br>Guadagno: ${formatNumber(allPremium.finalGain)} €<br>Costo Premium: ${formatNumber(allPremium.totalPremiumCost)} €</p>
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