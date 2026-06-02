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

const { calcolaAssegnazioneConArticolate } = require('./AssegnazioneCattedre');

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
    // 2. CONTO DELLE ORE DISPONIBILI E STAMPA PREVENTIVA (PRIMA DI TUTTO)
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
    // 3. PREPARAZIONE STRUTTURE DATI PER L'ALGORITMO
    // ======================================================================
    const arrayPiani = [];
    const indirizzi = ['Scientifico_biennio_comune', 'Scientifico_tradizionale', 'Scientifico_scienze_applicate', 'Scientifico_doppiaLingua'];
    
    indirizzi.forEach(ind => {
        for (let anno = 1; anno <= 5; anno++) {
            arrayPiani.push(
                { indirizzo: ind, anno: anno, codice_materia: 'ITA', ore_settimanali: 4 },
                { indirizzo: ind, anno: anno, codice_materia: 'MAT', ore_settimanali: 4 },
                { indirizzo: ind, anno: anno, codice_materia: 'STOGEO', ore_settimanali: 3 },
                { indirizzo: ind, anno: anno, codice_materia: 'DIS', ore_settimanali: 2 }
            );
        }
    });

    const orePerMateria = {};
    for (const chiaveRaw in orePerMateriaRaw) {
        const candidatiOriginali = orePerMateriaRaw[chiaveRaw] || [];
        const listaNormalizzata = candidatiOriginali.map(c => {
            let idRilevato = null;
            if (c.docente && c.docente.id) idRilevato = c.docente.id;
            else if (c.docente_id) idRilevato = c.docente_id;
            else if (c.id) idRilevato = c.id;

            return {
                docente_id: idRilevato,
                docente: anagrafica[idRilevato] || c.docente || { id: idRilevato }
            };
        }).filter(c => c.docente_id !== null);

        orePerMateria[chiaveRaw] = listaNormalizzata;
        const codiceBreve = mappaCodici[chiaveRaw];
        if (codiceBreve) { orePerMateria[codiceBreve] = listaNormalizzata; }
    }

    // Fallback di sicurezza se l'estrazione fallisce
    if (!orePerMateria['ITA'] || orePerMateria['ITA'].length === 0) orePerMateria['ITA'] = [{ docente_id: 1 }, { docente_id: 2 }, { docente_id: 3 }];
    if (!orePerMateria['STOGEO'] || orePerMateria['STOGEO'].length === 0) orePerMateria['STOGEO'] = [{ docente_id: 2 }];
    if (!orePerMateria['MAT'] || orePerMateria['MAT'].length === 0) orePerMateria['MAT'] = [{ docente_id: 4 }];
    if (!orePerMateria['DIS'] || orePerMateria['DIS'].length === 0) orePerMateria['DIS'] = [{ docente_id: 6 }];


    // ======================================================================
    // 4. INTERROGAZIONE DB E ASSEGNAZIONE CATTEDRE (COME ULTIMA COSA)
    // ======================================================================
    console.log("⏳ Collegamento al database e calcolo delle cattedre in corso...");
    let assegnazioniFinali = [];

    try {
        await inizializzaDatabase();
        await db.query("USE scuola1");

        const [classiRealiScuola] = await db.execute("SELECT nome_classe, indirizzo FROM classi");
        const [tabellaGruppi] = await db.execute("SELECT id_articolazione AS id_classe, nome_articolazione AS gruppo_classe FROM articolazioni");
        const [tabellaComComposition] = await db.execute("SELECT id_articolazione AS id_classe, nome_classe AS nome_classe_singola FROM articolazioni_classi");
        const [tabellaMaterie] = await db.execute("SELECT id_articolazione AS id_classe, nome_materia FROM articolazioni_materie");

        tabellaMaterie.forEach(m => {
            m.ore = 1; 
            if (mappaCodici[m.nome_materia]) m.nome_materia = mappaCodici[m.nome_materia];
        });

        const tabelleArticolate = { 
            tabellaGruppi, 
            tabellaComposizione: tabellaComComposition, 
            tabellaMaterie 
        };

        // Esecuzione dell'algoritmo
        assegnazioniFinali = calcolaAssegnazioneConArticolate(arrayPiani, anagrafica, orePerMateria, tabelleArticolate, classiRealiScuola);
        console.log(`\n-> Algoritmo terminato. Generate con successo ${assegnazioniFinali.length} cattedre.`);

    } catch (errore) {
        console.error("❌ Errore durante l'interrogazione DB:", errore.message);
    } finally {
        if (db && typeof db.end === 'function') await db.end();
    }


    // ======================================================================
    // 5. STRUTTURAZIONE DATI PER IL REPORT DETTAGLIATO
    // ======================================================================
    const oreCopertiReport = {};
    for (const mat in oreRichieste) { oreCopertiReport[mat] = []; }

    assegnazioniFinali.forEach(asg => {
        // Normalizziamo le sigle dell'algoritmo nei nomi estesi cercati dal report
        let nomeMateriaEsteso = mappaInversaCodici[asg.nome_materia] || asg.nome_materia;
        
        if (asg.nome_materia === 'STOGEO') nomeMateriaEsteso = 'Storia e geografia';
        if (asg.nome_materia === 'DIS') nomeMateriaEsteso = "Disegno e storia dell'arte";
        if (asg.nome_materia === 'ITA') nomeMateriaEsteso = 'Lingua e letteratura italiana';
        if (asg.nome_materia === 'MAT') nomeMateriaEsteso = 'Matematica';

        if (oreCopertiReport[nomeMateriaEsteso]) {
            const doc = anagrafica[asg.docente_id];
            oreCopertiReport[nomeMateriaEsteso].push({
                docente: doc || { id: asg.docente_id, cognome: asg.cognome || 'Docente', nome: asg.nome || `ID ${asg.docente_id}` },
                ore: asg.ore_assegnate || asg.ore || 0,
                classe: asg.nome_classe || asg.classe_target || 'N/D'
            });
        }
    });

    // Stampe finali a schermo
    stampaCoperturaMaterieDettaglio(oreRichieste, oreCopertiReport);
    stampaRiepilogoOreAltro(anagrafica, totaleOreAltro);
    stampaCoperturaTotale(totaleOreDocenti, totaleOrePiani);
}

main();