const readline = require('readline');
const { percorsoFile, db, inizializzaDatabase } = require('./config');
const {
    leggiFile,
    estraiDocenti,
    estraiMappaCodiciMaterie,
    estraiAssegnazioniDocentiMaterie
} = require('./estrazione');
const {
    stampaConteggioPreventivo,
    stampaCoperturaMaterieDettaglio,
    stampaRiepilogoOreAltro,
    stampaCoperturaTotale
} = require('./report');

// Helper per gestire l'input da terminale tramite Promise
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const chiedi = (testo) => new Promise((resolve) => rl.question(testo, resolve));

async function main() {
    // ======================================================================
    // 1. LETTURA FILE E PARSING INIZIALE
    // ======================================================================
    const vecchioLog = console.log;
    console.log = function(...args) {
        if (args[0] && (String(args[0]).includes("blocco trovato:") || String(args[0]).trim().startsWith("("))) {
            return; 
        }
        vecchioLog.apply(console, args);
    };

    const sql = leggiFile(percorsoFile);

    const datiDocenti = estraiDocenti(sql) || {};
    const anagrafica = datiDocenti.anagrafica || datiDocenti;
    const mappaCodici = estraiMappaCodiciMaterie(sql) || {};
    const orePerMateriaRaw = estraiAssegnazioniDocentiMaterie(sql, anagrafica, mappaCodici) || {};
    
    console.log = vecchioLog; // Ripristino immediato dei log

    const mappaInversaCodici = {};
    for (const nome in mappaCodici) { mappaInversaCodici[mappaCodici[nome]] = nome; }


    // ======================================================================
    // 2. CONTO DELLE ORE DISPONIBILI E STAMPA PREVENTIVA
    // ======================================================================
    let totaleOreDocenti = 0, totaleOreAltro = 0;
    sql.split('\n').forEach(riga => {
        if (riga.trim().startsWith('(')) {
            const campi = riga.replace(/[();]/g, '').split(/,(?=(?:(?:[^']*'){2})*[^']*$)/);
            if (campi.length >= 8 && !isNaN(campi[4])) {
                totaleOreDocenti += parseInt(campi[4].trim(), 10) || 0;
                const altro = campi[7].trim().toUpperCase();
                totaleOreAltro += (altro === 'NULL' || altro === '') ? 0 : (parseInt(altro, 10) || 0);
            }
        }
    });

    // Piani di studio fissi per determinare il totale ore richieste preventivo
    const oreRichieste = { 
        'Lingua e letteratura italiana': 16,
        'Storia e geografia': 12,
        'Matematica': 16,
        "Disegno e storia dell'arte": 8
    }; 
    const totaleOrePiani = Object.values(oreRichieste).reduce((a, b) => a + b, 0);

    // Chiamata immediata alla stampa del conteggio ore disponibili
    stampaConteggioPreventivo(totaleOreDocenti, totaleOrePiani, totaleOreAltro);


    // ======================================================================
    // 3. RECUPERO ASSEGNAZIONI ESISTENTI DAL DB E GENERAZIONE REPORT (PRIMA)
    // ======================================================================
    let assegnazioniAttuali = [];
    try {
        await inizializzaDatabase();
        await db.query("USE scuola1");

        // Recuperiamo le cattedre già esistenti nel database per mostrarle nel report iniziale
        const queryCattedreEsistenti = `
            SELECT c.docente_id, c.nome_classe, c.nome_materia, d.cognome, d.nome 
            FROM cattedre c
            JOIN docenti d ON c.docente_id = d.id
        `;
        const [cattedreSalvate] = await db.query(queryCattedreEsistenti);
        
        assegnazioniAttuali = cattedreSalvate.map(c => ({
            docente_id: c.docente_id,
            cognome: c.cognome,
            nome: c.nome,
            nome_materia: c.nome_materia,
            nome_classe: c.nome_classe,
            ore_assegnate: 0 // Verranno mappate o gestite dalle funzioni di report
        }));

    } catch (errore) {
        console.error("❌ Errore durante il caricamento iniziale dal DB:", errore.message);
    }

    // STRUTTURAZIONE DATI PER IL REPORT DETTAGLIATO
    const oreCopertiReport = {};
    for (const mat in oreRichieste) { oreCopertiReport[mat] = []; }

    assegnazioniAttuali.forEach(asg => {
        let nomeMateriaEsteso = mappaInversaCodici[asg.nome_materia] || asg.nome_materia;
        
        if (asg.nome_materia === 'STOGEO') nomeMateriaEsteso = 'Storia e geografia';
        if (asg.nome_materia === 'DIS') nomeMateriaEsteso = "Disegno e storia dell'arte";
        if (asg.nome_materia === 'ITA') nomeMateriaEsteso = 'Lingua e letteratura italiana';
        if (asg.nome_materia === 'MAT') nomeMateriaEsteso = 'Matematica';

        if (oreCopertiReport[nomeMateriaEsteso]) {
            const doc = anagrafica[asg.docente_id];
            oreCopertiReport[nomeMateriaEsteso].push({
                docente: doc || { id: asg.docente_id, cognome: asg.cognome || 'Docente', nome: asg.nome || `ID ${asg.docente_id}` },
                ore: asg.ore_assegnate || 0,
                classe: asg.nome_classe || 'N/D'
            });
        }
    });

    // Mostra la situazione attuale delle ore e la copertura delle materie prima delle modifiche
    stampaCoperturaMaterieDettaglio(oreRichieste, oreCopertiReport);
    stampaRiepilogoOreAltro(anagrafica, totaleOreAltro);
    stampaCoperturaTotale(totaleOreDocenti, totaleOrePiani);


    // ======================================================================
    // 4. INTERFACCIA INTERATTIVA E ASSEGNAZIONE MANUALE CATTEDRE (DOPO)
    // ======================================================================
    console.log("\n=================================================");
    console.log("     SISTEMA GESTIONALE CATTEDRE (INTERATTIVO)  ");
    console.log("=================================================\n");

    let continua = true;

    while (continua) {
        try {
            // --- STEP 4.1: SCELTA DEL TIPO DI CATTEDRA ---
            console.log("[1] Assegna a una Classe Normale (Singola)");
            console.log("[2] Assegna a un Gruppo Articolato (Più classi unite)");
            const sceltaTipo = await chiedi("\nSeleziona un'opzione (1 o 2): ");

            let classeTarget = "";
            let idArticolata = null;
            let listaMaterie = [];

            if (sceltaTipo === "1") {
                // --- GESTIONE CLASSE NORMALE ---
                const [classi] = await db.query("SELECT nome_classe FROM classi ORDER BY nome_classe");
                console.log("\n--- CLASSI SINGOLE DISPONIBILI ---");
                classi.forEach((c, i) => console.log(`[${i + 1}] Classe ${c.nome_classe}`));
                
                const numClasse = await chiedi("\nScegli il NUMERO della classe: ");
                classeTarget = classi[parseInt(numClasse, 10) - 1].nome_classe;

                // Recuperiamo tutte le materie generali dalla mappa dei codici estratta dal file SQL
                listaMaterie = Object.keys(mappaCodici).map(m => ({ nome: m, ore: 0 }));
            } 
            else if (sceltaTipo === "2") {
                // --- GESTIONE CLASSI ARTICOLATE ---
                const [gruppi] = await db.query("SELECT id_articolazione AS id_classe, nome_articolazione AS gruppo_classe FROM articolazioni");
                
                if(gruppi.length === 0) {
                    console.log("\n❌ Nessun gruppo articolato configurato nel database.");
                    break;
                }

                console.log("\n--- GRUPPI ARTICOLATI DISPONIBILI ---");
                gruppi.forEach((g, i) => console.log(`[${i + 1}] ${g.gruppo_classe} (ID: ${g.id_classe})`));

                const numGruppo = await chiedi("\nScegli il NUMERO del gruppo articolato: ");
                const gruppoScelto = gruppi[parseInt(numGruppo, 10) - 1];
                classeTarget = gruppoScelto.gruppo_classe;
                idArticolata = gruppoScelto.id_classe;

                // Recuperiamo le materie assegnate a QUESTO gruppo articolato
                const [matArticolate] = await db.query(
                    "SELECT nome_materia FROM articolazioni_materie WHERE id_articolazione = ?", 
                    [idArticolata]
                );
                listaMaterie = matArticolate.map(m => ({ nome: m.nome_materia, ore: 1 }));
            } 
            else {
                console.log("❌ Opzione non valida.");
                continue;
            }

            // --- STEP 4.2: SCELTA DELLA MATERIA ---
            if (listaMaterie.length === 0) {
                console.log("❌ Nessuna materia disponibile per questa selezione.");
                continue;
            }

            console.log("\n--- MATERIE DISPONIBILI ---");
            listaMaterie.forEach((m, i) => {
                const infoOre = m.ore > 0 ? `(${m.ore} ore previste)` : "";
                console.log(`[${i + 1}] ${m.nome} ${infoOre}`);
            });

            const numMateria = await chiedi("\nScegli il NUMERO della materia: ");
            const materiaScelta = listaMaterie[parseInt(numMateria, 10) - 1];

            let oreCattedra = materiaScelta.ore;
            if (sceltaTipo === "1") {
                const oreInput = await chiedi("\nQuante ore settimanali assegnare a questa cattedra? ");
                oreCattedra = parseInt(oreInput, 10);
            }

            // --- STEP 4.3: FILTRO E SCELTA DEL DOCENTE ABILITATO ---
            const queryDocenti = `
                SELECT id, cognome, nome, ore_contratto 
                FROM docenti 
                WHERE ore_contratto >= ?
                ORDER BY cognome ASC
            `;
            const [docentiIdonei] = await db.query(queryDocenti, [oreCattedra]);

            if (docentiIdonei.length === 0) {
                console.log(`\n❌ ALLARME: Nessun docente ha almeno ${oreCattedra} ore libere nel contratto!`);
                continue;
            }

            console.log(`\n--- DOCENTI DISPONIBILI (${oreCattedra}h richieste) ---`);
            docentiIdonei.forEach((d, i) => {
                console.log(`[${i + 1}] Prof. ${d.cognome} ${d.nome} (Ore residue contratto: ${d.ore_contratto}h)`);
            });

            const numDocente = await chiedi("\nScegli il NUMERO del docente da assegnare: ");
            const docenteScelto = docentiIdonei[parseInt(numDocente, 10) - 1];

            // --- STEP 4.4: SALVATAGGIO TRANSAZIONALE NEL DATABASE ---
            console.log("\nRegistrazione nei registri di phpMyAdmin...");

            const queryInsertCattedra = "INSERT INTO cattedre (docente_id, nome_classe, nome_materia) VALUES (?, ?, ?)";
            await db.query(queryInsertCattedra, [docenteScelto.id, classeTarget, materiaScelta.nome]);

            const queryUpdateDocente = "UPDATE docenti SET ore_contratto = ore_contratto - ? WHERE id = ?";
            await db.query(queryUpdateDocente, [oreCattedra, docenteScelto.id]);

            console.log("\n=================================================");
            console.log(" ✅ CATTEDRA REGISTRATA CON SUCCESSO!");
            console.log(` Target: ${classeTarget}`);
            console.log(` Materia: ${materiaScelta.nome} (${oreCattedra} ore)`);
            console.log(` Docente: Prof. ${docenteScelto.cognome} ${docenteScelto.nome}`);
            console.log("=================================================\n");

        } catch (errore) {
            console.error("❌ Errore durante le operazioni sul DB:", errore.message);
        }

        // Chiede all'utente se desidera continuare prima di chiudere l'applicazione
        const risposta = await chiedi("Vuoi assegnare un'altra cattedra? (s/n): ");
        if (risposta.toLowerCase() !== 's' && risposta.toLowerCase() !== 'si') {
            continua = false;
        } else {
            console.log("\n-------------------------------------------------\n");
        }
    }

    // Chiusura pulita delle risorse all'uscita definitiva
    console.log("\nUscita dal programma. Arrivederci!");
    chiudiTutto();
}

function chiudiTutto() {
    rl.close();
    if (db && typeof db.end === 'function') db.end();
}

main();