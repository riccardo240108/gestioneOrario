function stampaConteggioPreventivo(totaleOreDocenti, totaleOrePiani, totaleOreAltro) {
    console.log("=================================================");
    console.log("📊 CONTEGGIO ORE DISPONIBILI (Dal Dump SQL)");
    console.log("=================================================");
    console.log(`- Totale Ore Contrattuali Docenti: ${totaleOreDocenti} ore`);
    console.log(`- Totale Ore Destinate ad Altro:   ${totaleOreAltro} ore`);
    console.log(`- Ore nette disponibili Insegnamento: ${totaleOreDocenti - totaleOreAltro} ore`);
    console.log(`- Totale Ore Richieste dai Piani Studio: ${totaleOrePiani} ore`);
    console.log("=================================================\n");
}

function stampaCoperturaMaterieDettaglio(oreRichieste, orePerMateria) {
    console.log("=================================================");
    console.log("   ANALISI COPERTURA REALE DALLE CATTEDRE       ");
    console.log("=================================================\n");

    for (const materia in oreRichieste) {
        const oreNecessarie = oreRichieste[materia];
        const assegnazioni = orePerMateria[materia] || [];
        let oreCoperte = 0;

        console.log(`MATERIA: ${materia}`);
        console.log(`-> Ore totali richieste: ${oreNecessarie}`);
        console.log(`-> Docenti assegnati (${assegnazioni.length}):`);

        if (assegnazioni.length > 0) {
            assegnazioni.forEach(a => {
                const d = a.docente || {};
                const id = d.id || '?';
                const cognome = d.cognome || 'Docente';
                const nome = d.nome || '';
                const oreAssegnate = a.ore || 0;
                const classe = a.classe || 'N/D';

                console.log(`   - [ID: ${id}] ${cognome} ${nome} su Classe ${classe} -> ${oreAssegnate} ore`);
                oreCoperte += oreAssegnate;
            });
        } else {
            console.log("   - ⚠ NESSUN DOCENTE ASSEGNATO");
        }

        if (oreCoperte >= oreNecessarie) {
            console.log(`   ✅ COPERTA (Assegnate: ${oreCoperte} | Richieste: ${oreNecessarie})`);
        } else {
            console.log(`   ❌ SCOPERTA! Mancano ${oreNecessarie - oreCoperte} ore`);
        }
        console.log("-------------------------------------------------");
    }
}

function stampaRiepilogoOreAltro(anagrafica, totaleOreAltro) {
    console.log("\n=================================================");
    console.log("   RIEPILOGO ORE DESTINATE AD ALTRO            ");
    console.log("=================================================");

    for (const id in anagrafica) {
        const doc = anagrafica[id];
        const oreAltro = parseInt(doc.ore_altro || doc.altro, 10) || 0;
        if (oreAltro > 0) {
            console.log(`   - ${doc.cognome || 'Docente'} ${doc.nome || ''} (ID: ${id}) -> ${oreAltro} ore`);
        }
    }

    console.log(`-> Totale complessivo 'ore_altro': ${totaleOreAltro}`);
    console.log("=================================================\n");
}

function stampaCoperturaTotale(totaleOreDocenti, totaleOrePiani) {
    console.log("---------------------------------------");
    console.log(`Totale ore disponibili (Docenti): ${totaleOreDocenti}`);
    console.log(`Totale ore richieste (Piani Studio): ${totaleOrePiani}`);
    console.log("---------------------------------------");

    if (totaleOreDocenti >= totaleOrePiani) {
        console.log("Non ci sono ore da richiedere.\n");
        return true;
    } else {
        console.log(`Richiedere ${totaleOrePiani - totaleOreDocenti} ore`);
        return false;
    }
}

module.exports = {
    stampaConteggioPreventivo,
    stampaCoperturaMaterieDettaglio,
    stampaRiepilogoOreAltro,
    stampaCoperturaTotale,
};