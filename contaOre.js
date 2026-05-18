const fs = require('fs');
const path = require('path');

// Configurazione del file di input
const NOME_FILE_SQL = 'scuola1.sql'; 
const percorsoFile = path.join(__dirname, NOME_FILE_SQL);

/**
 * Legge il file SQL passato, estrae i dati tramite Espressioni Regolari (Regex),
 * calcola i totali delle ore e ne compara i valori.
 * * @param {string} pathFile - Il percorso assoluto del file .sql
 */
function controllaCoperturaOraria(pathFile) {
    try {
        // 1. Legge il file .sql come stringa di testo
        const contenutoSql = fs.readFileSync(pathFile, 'utf8');

        // 2. Estrazione e calcolo delle ore dei docenti
        // Il regex isola il numero delle ore prima di 'di ruolo', 'sostituto' o 'non di ruolo'
        const regexDocenti = /\(\d+,\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*(\d+),\s*'(?:di ruolo|sostituto|non di ruolo)'/g;
        let totaleOreDocenti = 0;
        let matchDocente;

        while ((matchDocente = regexDocenti.exec(contenutoSql)) !== null) {
            totaleOreDocenti += parseInt(matchDocente[1], 10);
        }

        // 3. Estrazione e calcolo delle ore dei piani di studio
        // Il regex isola l'ultimo numero (ore_settimanali) dentro la riga INSERT di piani_studi
        const regexPiani = /\('[^']+',\s*\d+,\s*'[^']+',\s*(\d+)\)/g;
        let totaleOrePiani = 0;
        let matchPiano;

        while ((matchPiano = regexPiani.exec(contenutoSql)) !== null) {
            totaleOrePiani += parseInt(matchPiano[1], 10);
        }

        // 4. Stampa dei resoconti a schermo
        console.log(`Totale ore disponibili (Docenti): ${totaleOreDocenti}`);
        console.log(`Totale ore richieste (Piani Studio): ${totaleOrePiani}`);
        console.log("---------------------------------------");

        // 5. Comparazione dei due valori e verdetto finale
        if (totaleOreDocenti >= totaleOrePiani) {
            console.log("Siamo apposto");
            return true;
        } else {
            const differenza = totaleOrePiani - totaleOreDocenti;
            console.log(`Richiedere ${differenza} ore`);
            return false;
        }

    } catch (errore) {
        console.error(`Errore durante l'elaborazione del file SQL:`, errore.message);
        return false;
    }
}


function analizzaDettaglioMaterieEDocenti(pathFile) {
    try {
        const contenutoSql = fs.readFileSync(pathFile, 'utf8');

        // ==========================================
        // 1. ESTRAZIONE DIZIONARIO MATERIE (Conversione Nome -> Codice EDT)
        // Nel file hai: ('Diritto ed economia', 'DIREC') o ('Lingua e cultura latina', 'LAT')
        // Ci serve per collegare i docenti (che hanno il nome esteso) ai piani di studio (che hanno il codice breve)
        // ==========================================
        const mappaNomiA_Codici = {};
        const regexDizionarioMaterie = /\('([^']+)',\s*'([^']*)'\)/g;
        let matchDizionario;
        
        while ((matchDizionario = regexDizionarioMaterie.exec(contenutoSql)) !== null) {
            // Struttura: mappaNomiA_Codici["Lingua e cultura latina"] = "LAT"
            mappaNomiA_Codici[matchDizionario[1]] = matchDizionario[2];
        }

        // Accorgimento manuale qualora nel dump mancassero alcune conversioni esplicite
        mappaNomiA_Codici['Lingua e letteratura italiana'] = 'ITA'; 

        // ==========================================
        // 2. ESTRAZIONE ANAGRAFICA DOCENTI
        // ==========================================
        const anagraficaDocenti = {};
        const regexDocenti = /\((\d+),\s*'([^']+)',\s*'([^']+)'.*?,\s*(\d+),\s*'(?:di ruolo|sostituto|non di ruolo)'/g;
        let matchDocente;

        while ((matchDocente = regexDocenti.exec(contenutoSql)) !== null) {
            anagraficaDocenti[matchDocente[1]] = {
                cognome: matchDocente[2],
                nome: matchDocente[3]
            };
        }

        // ==========================================
        // 3. ESTRAZIONE ASSEGNAZIONI ORE (Dalla tabella docenti_materie)
        // Struttura nel file SQL: INSERT INTO docenti_materie ... VALUES (1, 'Nome Materia', 4)
        // ==========================================
        const oreDocentiPerMateria = {}; // Struttura finale: { 'LAT': [ {id, cognome, nome, oreAssegnate}, ... ] }
        const regexDocentiMaterie = /\((\d+),\s*'([^']*)',\s*(\d+)\)/g;
        let matchAssegnazione;

        while ((matchAssegnazione = regexDocentiMaterie.exec(contenutoSql)) !== null) {
            const docenteId = matchAssegnazione[1];
            const nomeMateriaEsteso = matchAssegnazione[2];
            const oreAssegnate = parseInt(matchAssegnazione[3], 10);
            
            // Trova il codice abbreviato (es. 'LAT') corrispondente al nome esteso della materia
            const codiceMateria = mappaNomiA_Codici[nomeMateriaEsteso] || nomeMateriaEsteso; 
            const datiDocente = anagraficaDocenti[docenteId] || { cognome: 'Sconosciuto', nome: 'Docente' };

            if (!oreDocentiPerMateria[codiceMateria]) {
                oreDocentiPerMateria[codiceMateria] = [];
            }

            oreDocentiPerMateria[codiceMateria].push({
                id: docenteId,
                cognome: datiDocente.cognome,
                nome: datiDocente.nome,
                oreAssegnate: oreAssegnate
            });
        }

        // ==========================================
        // 4. ESTRAZIONE E AGGREGAZIONE ORE PIANI DI STUDIO
        // ==========================================
        const oreRichiestePerMateria = {};
        const regexPiani = /\('[^']+',\s*\d+,\s*'([^']+)',\s*(\d+)\)/g;
        let matchPiano;

        while ((matchPiano = regexPiani.exec(contenutoSql)) !== null) {
            const codiceMateria = matchPiano[1];
            const ore = parseInt(matchPiano[2], 10);

            if (!oreRichiestePerMateria[codiceMateria]) {
                oreRichiestePerMateria[codiceMateria] = 0;
            }
            oreRichiestePerMateria[codiceMateria] += ore;
        }

        // ==========================================
        // 5. GENERAZIONE REPORT REALE E VERIDICO
        // ==========================================
        console.log("=================================================");
        console.log("   ANALISI COPERTURA REALE DALLE CATTEDRE       ");
        console.log("=================================================\n");

        for (const materia in oreRichiestePerMateria) {
            const oreNecessarie = oreRichiestePerMateria[materia];
            console.log(`MATERIA: ${materia}`);
            console.log(`-> Ore totali richieste dai piani di studio: ${oreNecessarie}`);

            // Prende solo i docenti assegnati specificamente a QUESTA materia con le relative ore dedicate
            const docentiAssegnati = oreDocentiPerMateria[materia] || [];
            
            console.log(`-> Docenti assegnati a questa materia (${docentiAssegnati.length}):`);
            
            let oreTotaliEffettiveMateria = 0;
            if (docentiAssegnati.length > 0) {
                docentiAssegnati.forEach(d => {
                    console.log(`   - [ID: ${d.id}] ${d.cognome} ${d.nome} -> Copre ${d.oreAssegnate} ore per questa materia`);
                    oreTotaliEffettiveMateria += d.oreAssegnate;
                });
            } else {
                console.log("   - ⚠ NESSUN DOCENTE ANCORA ASSEGNATO A QUESTA MATERIA IN 'docenti_materie'");
            }

            console.log(`-> Bilancio ore per ${materia}:`);
            if (oreTotaliEffettiveMateria >= oreNecessarie) {
                console.log(`   ✅ COPERTA COMPLETAMENTE (Assegnate: ${oreTotaliEffettiveMateria} ore | Richieste: ${oreNecessarie} ore)`);
            } else {
                const mancano = oreNecessarie - oreTotaliEffettiveMateria;
                console.log(`   ❌ SCOPERTA! Mancano ancora ${mancano} ore per soddisfare il piano di studi.`);
            }
            console.log("-------------------------------------------------");
        }

    } catch (errore) {
        console.error(`Errore durante l'analisi di dettaglio:`, errore.message);
    }
}

// Esecuzione
analizzaDettaglioMaterieEDocenti(percorsoFile);
// 6. Esecuzione della funzione principale
controllaCoperturaOraria(percorsoFile);