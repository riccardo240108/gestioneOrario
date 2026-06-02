function calcolaAssegnazioneConArticolate(pianiStudio, anagrafica, orePerMateria, tabelleArticolate, classiRealiScuola) {
    const assegnazioniFinali = [];
    
    // Estrazione delle tabelle di aggregazione
    const { tabellaGruppi, tabellaComposizione, tabellaMaterie } = tabelleArticolate;

    console.log(`\n--- DEBUG ALGORITMO ---`);
    console.log(`Classi reali ricevute dal DB: ${classiRealiScuola ? classiRealiScuola.length : 0}`);
    console.log(`Piani di studio attivi: ${pianiStudio ? pianiStudio.length : 0}`);

    // Pre-inizializzazione sicura delle ore residue per ogni docente per evitare 'undefined'
    for (const id in anagrafica) {
        const doc = anagrafica[id];
        // Cerchiamo la proprietà delle ore contrattuali in modo flessibile
        const oreIniziali = parseInt(doc.ore_contratto || doc.ore || doc.ore_totali || 18, 10);
        // Usiamo una variabile separata 'ore_residue' per non distruggere i dati originali
        if (doc.ore_residue === undefined) {
            doc.ore_residue = oreIniziali;
        }
    }

    // --- FASE 1: ASSEGNAZIONE DELLE CLASSI ARTICOLATE ---
    if (tabellaGruppi && Array.isArray(tabellaGruppi)) {
        tabellaGruppi.forEach(gruppo => {
            const idClasseArticolata = gruppo.id_classe; 
            const nomeGruppo = gruppo.gruppo_classe;     

            const materieGruppo = tabellaMaterie.filter(m => m.id_classe === idClasseArticolata);

            const classiCoinvolte = tabellaComposizione
                .filter(c => c.id_classe === idClasseArticolata)
                .map(c => c.nome_classe_singola)
                .join(" + "); 

            materieGruppo.forEach(materiaArticolata => {
                const codiceMateria = materiaArticolata.nome_materia; 
                const oreNecessarie = materiaArticolata.ore || 1;

                const candidati = orePerMateria[codiceMateria] || [];

                for (let i = 0; i < candidati.length; i++) {
                    const docenteId = candidati[i].docente ? candidati[i].docente.id : candidati[i].docente_id;
                    const docenteAnagrafica = anagrafica[docenteId];

                    if (docenteAnagrafica && docenteAnagrafica.ore_residue >= oreNecessarie) {
                        docenteAnagrafica.ore_residue -= oreNecessarie;

                        assegnazioniFinali.push({
                            docente_id: docenteId,
                            classe_target: nomeGruppo, 
                            classi_reali: classiCoinvolte,
                            nome_materia: codiceMateria,
                            ore_assegnate: oreNecessarie,
                            tipo: 'ARTICOLATA'
                        });
                        break;
                    }
                }
            });
        });
    }

    // --- FASE 2: ASSEGNAZIONE DELLE CLASSI NORMALI SINGOLE ---
    if (classiRealiScuola && Array.isArray(classiRealiScuola)) {
        classiRealiScuola.forEach(classe => {
            const nomeClasse = classe.nome_classe ? classe.nome_classe.trim() : "";   
            const indirizzoClasse = classe.indirizzo ? classe.indirizzo.trim() : ""; 
            
            // Estrazione sicura del primo numero nel nome classe
            const matchAnno = nomeClasse.match(/\d+/);
            const annoCorso = matchAnno ? parseInt(matchAnno[0], 10) : null;

            if (!annoCorso) {
                console.log(`⚠️ Impossibile determinare l'anno per la classe: "${nomeClasse}"`);
                return;
            }

            // Filtra i piani di studio. Tolleranza sulle stringhe (lowercase e pulizia spazi)
            const materieDaCoprire = pianiStudio.filter(p => {
                const indPiano = p.indirizzo.toLowerCase().replace(/_/g, ' ');
                const indClasse = indirizzoClasse.toLowerCase().replace(/_/g, ' ');
                // Riconosce il match se uno contiene l'altro (es. "Scientifico" contenuto in "Scientifico tradizionale")
                return (indPiano.includes(indClasse) || indClasse.includes(indPiano)) && p.anno === annoCorso;
            });

            if (materieDaCoprire.length === 0) {
                console.log(`⚠️ Nessuna materia nei Piani Studio per Classe: ${nomeClasse} (${indirizzoClasse}) Anno: ${annoCorso}`);
            }

            materieDaCoprire.forEach(piano => {
                const codiceMateria = piano.codice_materia; 
                const oreNecessarie = piano.ore_settimanali;

                // Controllo se già assorbita dall'articolata
                const giaCopertaInArticolata = assegnazioniFinali.some(a => 
                    a.tipo === 'ARTICOLATA' && 
                    a.nome_materia === codiceMateria && 
                    a.classi_reali && a.classi_reali.includes(nomeClasse)
                );

                if (giaCopertaInArticolata) return; 

                const candidatiAbilitati = orePerMateria[codiceMateria] || [];
                let assegnata = false;

                for (let i = 0; i < candidatiAbilitati.length; i++) {
                    const docenteId = candidatiAbilitati[i].docente ? candidatiAbilitati[i].docente.id : candidatiAbilitati[i].docente_id;
                    const docenteAnagrafica = anagrafica[docenteId];

                    if (docenteAnagrafica && docenteAnagrafica.ore_residue >= oreNecessarie) {
                        docenteAnagrafica.ore_residue -= oreNecessarie;

                        assegnazioniFinali.push({
                            docente_id: docenteId,
                            cognome: docenteAnagrafica.cognome || 'Docente',
                            nome: docenteAnagrafica.nome || `ID ${docenteId}`,
                            nome_classe: nomeClasse,
                            nome_materia: codiceMateria, 
                            ore_assegnate: oreNecessarie,
                            tipo: 'NORMALE'
                        });
                        assegnata = true;
                        break; 
                    }
                }

                if (!assegnata) {
                    console.log(`❌ Nessun docente con ore sufficienti per ${codiceMateria} nella classe ${nomeClasse}`);
                }
            });
        });
    }

    return assegnazioniFinali;
}

module.exports = { calcolaAssegnazioneConArticolate };