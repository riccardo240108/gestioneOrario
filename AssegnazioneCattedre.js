function calcolaAssegnazioneConArticolate(pianiStudio, anagrafica, orePerMateria, tabelleArticolate) {
    const assegnazioniFinali = [];
    
    // Estraiamo le 3 tabelle che hai menzionato
    const { tabellaGruppi, tabellaComposizione, tabellaMaterie } = tabelleArticolate;

    console.log("\n=================================================");
    console.log("   AVVIO ALGORITMO CON GESTIONE ARTICOLATE       ");
    console.log("=================================================\n");

    // --- FASE 1: ASSEGNAZIONE DELLE CLASSI ARTICOLATE (Prioritaria per evitare conflitti) ---
    console.log("--- Elaborazione Cattedre Articolate ---");
    
    tabellaGruppi.forEach(gruppo => {
        const idClasseArticolata = gruppo.id_classe; // L'ID fittizio dell'articolazione
        const nomeGruppo = gruppo.gruppo_classe;     // Es: "Gruppo 3A-3B"

        // 1. Troviamo quali materie fa questo gruppo articolato (Dalla terza tabella)
        const materieGruppo = tabellaMaterie.filter(m => m.id_classe === idClasseArticolata);

        // 2. Troviamo quali classi reali sono coinvolte (Dalla seconda tabella) per i report
        const classiCoinvolte = tabellaComposizione
            .filter(c => c.id_classe === idClasseArticolata)
            .map(c => c.nome_classe_singola)
            .join(" + "); // Es: "3A + 3B"

        materieGruppo.forEach(materiaArticolata => {
            const codiceMateria = materiaArticolata.nome_materia; // o codice_edt
            const oreNecessarie = materiaArticolata.ore;

            console.log(`Analisi articolata [${nomeGruppo}] (${classiCoinvolte}) per Materia: ${codiceMateria} (${oreNecessarie} ore)`);

            // Cerchiamo il docente abilitato con ore residue sufficienti
            const candidati = orePerMateria[codiceMateria] || [];
            let cattedraCoperta = false;

            for (let i = 0; i < candidati.length; i++) {
                const docenteAnagrafica = anagrafica[candidati[i].docente.id];

                // Verifichiamo se ha ore nel contratto
                if (docenteAnagrafica.ore_contratto >= oreNecessarie) {
                    // Sottraiamo le ore (il docente lavora 1 volta sola per entrambe le classi riunite!)
                    docenteAnagrafica.ore_contratto -= oreNecessarie;

                    // Registriamo l'assegnazione speciale
                    assegnazioniFinali.push({
                        docente_id: docenteAnagrafica.id,
                        classe_target: nomeGruppo, // Specifichiamo il gruppo articolato
                        classi_reali: classiCoinvolte,
                        nome_materia: codiceMateria,
                        ore_assegnate: oreNecessarie,
                        tipo: 'ARTICOLATA'
                    });

                    console.log(`  ✅ [ARTICOLATA] Assegnato a: ${docenteAnagrafica.cognome} (Ore residue: ${docenteAnagrafica.ore_contratto})`);
                    cattedraCoperta = true;
                    break;
                }
            }

            if (!cattedraCoperta) {
                console.log(`  ❌ ⚠ Impossibile coprire l'articolata di ${codiceMateria} per ${nomeGruppo}`);
            }
        });
    });

    //
// --- FASE 2: ASSEGNAZIONE DELLE CLASSI NORMALI SINGOLE ---
    console.log("\n--- FASE 2: Inizio Elaborazione Cattedre Normali Singole ---");

    // 1. Scorriamo una per una tutte le classi reali dell'istituto (es. '1A', '1B', '1C'...)
    classiRealiScuola.forEach(classe => {
        const nomeClasse = classe.nome_classe;   // Es: "1A"
        const indirizzoClasse = classe.indirizzo; // Es: "Scientifico_biennio_comune"
        const annoCorso = parseInt(nomeClasse.substring(0, 1), 10); // Estrae l'anno (es: 1)

        // 2. Troviamo il piano di studi associato a questa specifica classe per l'anno in corso
        const materieDaCoprire = pianiStudio.filter(p => 
            p.indirizzo === indirizzoClasse && p.anno === annoCorso
        );

        console.log(`\nStiamo coprendo la Classe ${nomeClasse} (${indirizzoClasse}) - Materie previste: ${materieDaCoprire.length}`);

        // 3. Per ogni materia richiesta nel piano di studi di questa classe...
        materieDaCoprire.forEach(piano => {
            const codiceMateria = piano.codice_materia; // Es: "MAT" o "ITA"
            const oreNecessarie = piano.ore_settimanali;

            // CONTROLLO DI SICUREZZA: Verifichiamo se questa materia per questa classe 
            // è già stata assorbita e coperta in un gruppo articolato durante la Fase 1.
            const giaCopertaInArticolata = assegnazioniFinali.some(a => 
                a.tipo === 'ARTICOLATA' && 
                a.nome_materia === codiceMateria && 
                a.classi_reali.includes(nomeClasse)
            );

            if (giaCopertaInArticolata) {
                console.log(`  跳 Salto ${codiceMateria} per la classe ${nomeClasse}: già coperta dal gruppo articolato (Fase 1).`);
                return; // Passa alla materia successiva
            }

            console.log(`  -> Analisi Fabbisogno: ${codiceMateria} richiede ${oreNecessarie} ore`);

            // 4. Cerchiamo i docenti abilitati a questa materia
            const candidatiAbilitati = orePerMateria[codiceMateria] || [];
            let cattedraAssegnata = false;

            // 5. Cerchiamo il primo docente con ore contrattuali residue sufficienti
            for (let i = 0; i < candidatiAbilitati.length; i++) {
                // Recuperiamo il docente in tempo reale dall'anagrafica centrale per avere le ore aggiornate
                const docenteId = candidatiAbilitati[i].docente.id;
                const docenteAnagrafica = anagrafica[docenteId];

                // Se le ore residue del contratto bastano a coprire la cattedra
                if (docenteAnagrafica.ore_contratto >= oreNecessarie) {
                    
                    // Sottraiamo le ore dal contratto del docente
                    docenteAnagrafica.ore_contratto -= oreNecessarie;

                    // Registriamo la cattedra standard (struttura corrispondente al tuo DB MySQL)
                    assegnazioniFinali.push({
                        docente_id: docenteAnagrafica.id,
                        cognome: docenteAnagrafica.cognome,
                        nome: docenteAnagrafica.nome,
                        nome_classe: nomeClasse,
                        nome_materia: codiceMateria, // Diventerà la stringa/codice nel DB
                        ore_assegnate: oreNecessarie,
                        tipo: 'NORMALE'
                    });

                    console.log(`    ✅ Assegnato: [ID: ${docenteAnagrafica.id}] ${docenteAnagrafica.cognome} ${docenteAnagrafica.nome} (Ore rimaste: ${docenteAnagrafica.ore_contratto})`);
                    cattedraAssegnata = true;
                    break; // Cattedra coperta! Usciamo dal ciclo dei docenti per questa materia
                }
            }

            if (!cattedraAssegnata) {
                console.log(`    ❌ ⚠ ALLARME: Nessun docente ha abbastanza ore residue per coprire ${codiceMateria} in ${nomeClasse}!`);
            }
        });
    });

    console.log("\n=================================================");
    console.log("          ELABORAZIONE COMPLETA TERMINATA       ");
    console.log("=================================================\n");

    return assegnazioniFinali;
}

module.exports = { calcolaAssegnazioneCompleta };
