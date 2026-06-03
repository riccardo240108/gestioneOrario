const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const http = require('http'); // <--- Modulo nativo per le API HTTP

const { percorsoFile, db, inizializzaDatabase } = require('./config');
const {
    leggiFile,
    estraiDocenti,
    estraiMappaCodiciMaterie,
    estraiAssegnazioniDocentiMaterie
} = require('./estrazione');
const {
    stampaConteggioPreventivo
} = require('./report');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const chiedi = (testo) => new Promise((resolve) => rl.question(testo, resolve));

// --- DICHIARAZIONE DEL SERVER WEB API INTERNO ---
function avviaServerAPI(anagrafica, mappaCodici) {
    const server = http.createServer(async (req, res) => {
        // Gestione delle intestazioni CORS per permettere all'HTML di comunicare liberamente
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Endpoint 1: Caricamento dati completi combinati (da Dump SQL + Tabelle Live MySQL)
        if (req.url === '/api/dati-iniziali' && req.method === 'GET') {
            try {
                await db.query("USE scuola1");
                
                // Recuperiamo i dati in tempo reale dalle tabelle del database MySQL
                const [docentiDb] = await db.query("SELECT id, cognome, nome, ore_contratto, ore_altro FROM docenti");
                const [cattedreDb] = await db.query("SELECT docente_id, nome_classe, nome_materia FROM cattedre");
                const [classiDb] = await db.query("SELECT nome_classe FROM classi");
                const [articolazioniDb] = await db.query("SELECT id_articolazione AS id_classe, nome_articolazione AS gruppo_classe FROM articolazioni");
                const [artMaterieDb] = await db.query("SELECT id_articolazione, nome_materia FROM articolazioni_materie");

                // Mappiamo i dati nel formato atteso dall'interfaccia UI
                const docentiMappa = {};
                docentiDb.forEach(d => {
                    docentiMappa[d.id] = { id: d.id, cognome: d.cognome, nome: d.nome, ore_contratto: d.ore_contratto, ore_altro: d.ore_altro };
                });

                const artMaterieMappa = {};
                artMaterieDb.forEach(am => {
                    if (!artMaterieMappa[am.id_articolazione]) artMaterieMappa[am.id_articolazione] = [];
                    artMaterieMappa[am.id_articolazione].push(am.nome_materia);
                });

                const rispostaPayload = {
                    docenti: Object.keys(docentiMappa).length > 0 ? docentiMappa : anagrafica,
                    mappaCodici: mappaCodici,
                    cattedre: cattedreDb.map(c => ({ ...c, ore: 4 })), // Default ore simulato
                    classi: classiDb.map(c => c.nome_classe),
                    articolazioni: articolazioniDb,
                    articolazioniMaterie: artMaterieMappa
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(rispostaPayload));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: true, message: err.message }));
            }
        } 
        // Endpoint 2: Registrazione transazionale di una cattedra inviata dalla UI
        else if (req.url === '/api/assegna-cattedra' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    await db.query("USE scuola1");

                    // 1. Inserimento in tabella cattedre
                    await db.query("INSERT INTO cattedre (docente_id, nome_classe, nome_materia) VALUES (?, ?, ?)", 
                        [data.docente_id, data.nome_classe, data.nome_materia]);

                    // 2. Scaliamo le ore dal contratto del docente
                    await db.query("UPDATE docenti SET ore_contratto = ore_contratto - ? WHERE id = ?", 
                        [data.ore || 4, data.docente_id]);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                    console.log(`\n🔔 [UI] Assegnata cattedra: Prof. ID ${data.docente_id} -> ${data.nome_classe} (${data.nome_materia})`);
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: err.message }));
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(3000, () => {
        console.log("🚀 Server API attivo in background su http://localhost:3000");
    });
}

function apriInterfacciaGrafica() {
    const percorsoHtml = path.join(__dirname, 'index.html');
    let comando = '';

    switch (os.platform()) {
        case 'win32': comando = `start "" "${percorsoHtml}"`; break;
        case 'darwin': comando = `open "${percorsoHtml}"`; break;
        default: comando = `xdg-open "${percorsoHtml}"`; break;
    }

    exec(comando, (err) => {
        if (!err) console.log("🌐 Interfaccia grafica lanciata automaticamente nel browser!\n");
    });
}

async function main() {
    // Silenziamo log interni ridondanti del parser
    const vecchioLog = console.log;
    console.log = function(...args) {
        if (args[0] && (String(args[0]).includes("blocco trovato:") || String(args[0]).trim().startsWith("("))) return;
        vecchioLog.apply(console, args);
    };

    const sql = leggiFile(percorsoFile);
    const datiDocenti = estraiDocenti(sql) || {};
    const anagrafica = datiDocenti.anagrafica || datiDocenti;
    const mappaCodici = estraiMappaCodiciMaterie(sql) || {};
    
    console.log = vecchioLog; // Ripristino log

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
    const totaleOrePiani = 52; 

    // Stampa iniziale preventiva sul terminale
    stampaConteggioPreventivo(totaleOreDocenti, totaleOrePiani, totaleOreAltro);

    // --- AVVIO DELLE FUNZIONALITÀ GRAFICHE E SERVER ---
    avviaServerAPI(anagrafica, mappaCodici);
    apriInterfacciaGrafica();

    // --- INTERFACCIA INTERATTIVA DA TERMINALE STANDARD ---
    console.log("=================================================");
    console.log("     SISTEMA GESTIONALE CATTEDRE INTERATTIVO     ");
    console.log("=================================================\n");

    let continua = true;
    while (continua) {
        try {
            await inizializzaDatabase();
            await db.query("USE scuola1");

            console.log("[1] Assegna a una Classe Normale (Singola)");
            console.log("[2] Assegna a un Gruppo Articolato (Più classi unite)");
            const sceltaTipo = await chiedi("\nSeleziona un'opzione (1 o 2): ");

            let classeTarget = "";
            let idArticolata = null;
            let listaMaterie = [];

            if (sceltaTipo === "1") {
                const [classi] = await db.query("SELECT nome_classe FROM classi ORDER BY nome_classe");
                console.log("\n--- CLASSI SINGOLE DISPONIBILI ---");
                classi.forEach((c, i) => console.log(`[${i + 1}] Classe ${c.nome_classe}`));
                
                const numClasse = await chiedi("\nScegli il NUMERO della classe: ");
                classeTarget = classi[parseInt(numClasse, 10) - 1].nome_classe;
                listaMaterie = Object.keys(mappaCodici).map(m => ({ nome: m, ore: 0 }));
            } else if (sceltaTipo === "2") {
                const [gruppi] = await db.query("SELECT id_articolazione AS id_classe, nome_articolazione AS gruppo_classe FROM articolazioni");
                if(gruppi.length === 0) { console.log("\n❌ Nessun gruppo articolato."); break; }
                console.log("\n--- GRUPPI ARTICOLATI DISPONIBILI ---");
                gruppi.forEach((g, i) => console.log(`[${i + 1}] ${g.grupo_classe || g.gruppo_classe}`));

                const numGruppo = await chiedi("\nScegli il NUMERO del gruppo articolato: ");
                const gruppoScelto = gruppi[parseInt(numGruppo, 10) - 1];
                classeTarget = gruppoScelto.gruppo_classe || gruppoScelto.grupo_classe;
                idArticolata = gruppoScelto.id_classe;

                const [matArticolate] = await db.query("SELECT nome_materia FROM articolazioni_materie WHERE id_articolazione = ?", [idArticolata]);
                listaMaterie = matArticolate.map(m => ({ nome: m.nome_materia, ore: 1 }));
            } else { console.log("❌ Scelta non valida."); continue; }

            console.log("\n--- MATERIE DISPONIBILI ---");
            listaMaterie.forEach((m, i) => console.log(`[${i + 1}] ${m.nome}`));
            const numMateria = await chiedi("\nScegli il NUMERO della materia: ");
            const materiaScelta = listaMaterie[parseInt(numMateria, 10) - 1];

            let oreCattedra = materiaScelta.ore || 4;
            if (sceltaTipo === "1") {
                const oreInput = await chiedi("\nOre settimanali da assegnare: ");
                oreCattedra = parseInt(oreInput, 10) || 4;
            }

            const [docentiIdonei] = await db.query("SELECT id, cognome, nome, ore_contratto FROM docenti WHERE ore_contratto >= ? ORDER BY cognome ASC", [oreCattedra]);
            if (docentiIdonei.length === 0) { console.log("\n❌ Nessun docente ha ore sufficienti."); continue; }

            docentiIdonei.forEach((d, i) => console.log(`[${i + 1}] Prof. ${d.cognome} (Residuo: ${d.ore_contratto}h)`));
            const numDocente = await chiedi("\nScegli il NUMERO del docente: ");
            const docenteScelto = docentiIdonei[parseInt(numDocente, 10) - 1];

            await db.query("INSERT INTO cattedre (docente_id, nome_classe, nome_materia) VALUES (?, ?, ?)", [docenteScelto.id, classeTarget, materiaScelta.nome]);
            await db.query("UPDATE docenti SET ore_contratto = ore_contratto - ? WHERE id = ?", [oreCattedra, docenteScelto.id]);

            console.log("\n✅ CATTEDRA REGISTRATA DA TERMINALE!");
        } catch (errore) {
            console.error("❌ Errore:", errore.message);
        }

        const risposta = await chiedi("Vuoi assegnare un'altra cattedra? (s/n): ");
        if (risposta.toLowerCase() !== 's' && risposta.toLowerCase() !== 'si') continua = false;
    }

    rl.close();
    process.exit(0);
}

main();