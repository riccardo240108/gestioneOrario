const readline = require('readline');
const mysql = require('mysql2');

// Connessione al database MySQL/MariaDB di XAMPP
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'scuola1' // Il nome del tuo DB
}).promise(); // Abilitiamo l'uso delle Promise per evitare i "callback hell"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Funzione helper per fare domande nel terminale
const chiedi = (testo) => new Promise((resolve) => rl.question(testo, resolve));

async function main() {
    console.log("\n=================================================");
    console.log("     SISTEMA GESTIONALE CATTEDRE (TERMINALE)    ");
    console.log("=================================================\n");

    try {
        // --- STEP 1: SCELTA DEL TIPO DI CATTEDRA ---
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

            // Recuperiamo tutte le materie generali per le classi normali
            const [materie] = await db.query("SELECT nome_materia FROM materie ORDER BY nome_materia");
            listaMaterie = materie.map(m => ({ nome: m.nome_materia, ore: 0 })); // Le ore verranno chieste dopo
        } 
        else if (sceltaTipo === "2") {
            // --- GESTIONE CLASSI ARTICOLATE ---
            // Nota: Adattato sulla struttura a 3 tabelle (Gruppi, Composizione, Materie del gruppo)
            // Supponiamo che le tabelle si chiamino 'articolate_gruppi' e 'articolate_materie'
            const [gruppi] = await db.query("SELECT id_classe, gruppo_classe FROM articolate_gruppi");
            
            if(gruppi.length === 0) {
                console.log("\n❌ Nessun gruppo articolato configurato nel database.");
                return chiudiTutto();
            }

            console.log("\n--- GRUPPI ARTICOLATI DISPONIBILI ---");
            gruppi.forEach((g, i) => console.log(`[${i + 1}] ${g.gruppo_classe} (ID: ${g.id_classe})`));

            const numGruppo = await chiedi("\nScegli il NUMERO del gruppo articolato: ");
            const gruppoScelto = gruppi[parseInt(numGruppo, 10) - 1];
            classeTarget = gruppoScelto.gruppo_classe;
            idArticolata = gruppoScelto.id_classe;

            // Recuperiamo solo le materie specifiche assegnate a QUESTO gruppo articolato
            const [matArticolate] = await db.query(
                "SELECT nome_materia, ore FROM articolate_materie WHERE id_classe = ?", 
                [idArticolata]
            );
            listaMaterie = matArticolate.map(m => ({ nome: m.nome_materia, ore: m.ore }));
        } 
        else {
            console.log("❌ Opzione non valida.");
            return chiudiTutto();
        }

        // --- STEP 2: SCELTA DELLA MATERIA ---
        if (listaMaterie.length === 0) {
            console.log("❌ Nessuna materia disponibile per questa selezione.");
            return chiudiTutto();
        }

        console.log("\n--- MATERIE DISPONIBILI ---");
        listaMaterie.forEach((m, i) => {
            const infoOre = m.ore > 0 ? `(${m.ore} ore previste)` : "";
            console.log(`[${i + 1}] ${m.nome} ${infoOre}`);
        });

        const numMateria = await chiedi("\nScegli il NUMERO della materia: ");
        const materiaScelta = listaMaterie[parseInt(numMateria, 10) - 1];

        // Se è una classe normale, chiediamo le ore. Se è articolata, le ore sono già fisse nel DB.
        let oreCattedra = materiaScelta.ore;
        if (sceltaTipo === "1") {
            const oreInput = await chiedi("\nQuante ore settimanali assegnare a questa cattedra? ");
            oreCattedra = parseInt(oreInput, 10);
        }

        // --- STEP 3: FILTRO E SCELTA DEL DOCENTE ABILITATO ---
        // Selezioniamo solo i docenti che insegnano QUELLA materia (Join con docenti_materie)
        // e che hanno ore_contratto sufficienti
        const queryDocenti = `
            SELECT d.id, d.cognome, d.nome, d.ore_contratto 
            FROM docenti d
            JOIN docenti_materie dm ON d.id = dm.docente_id
            WHERE dm.nome_materia = ? AND d.ore_contratto >= ?
            ORDER BY d.cognome ASC
        `;
        const [docentiIdonei] = await db.query(queryDocenti, [materiaScelta.nome, oreCattedra]);

        if (docentiIdonei.length === 0) {
            console.log(`\n❌ ALLARME: Nessun docente abilitato a '${materiaScelta.nome}' ha almeno ${oreCattedra} ore libere nel contratto!`);
            return chiudiTutto();
        }

        console.log(`\n--- DOCENTI ABILITATI E DISPONIBILI (${oreCattedra}h richieste) ---`);
        docentiIdonei.forEach((d, i) => {
            console.log(`[${i + 1}] Prof. ${d.cognome} ${d.nome} (Ore residue contratto: ${d.ore_contratto}h)`);
        });

        const numDocente = await chiedi("\nScegli il NUMERO del docente da assegnare: ");
        const docenteScelto = docentiIdonei[parseInt(numDocente, 10) - 1];

        // --- STEP 4: SALVATAGGIO TRANSAZIONALE NEL DATABASE ---
        console.log("\nRegistrazione nei registri di phpMyAdmin...");

        // 1. Inseriamo la riga nella tabella cattedre (se è articolata, inseriamo il nome del gruppo come classe)
        const queryInsertCattedra = "INSERT INTO cattedre (docente_id, nome_classe, nome_materia) VALUES (?, ?, ?)";
        await db.query(queryInsertCattedra, [docenteScelto.id, classeTarget, materiaScelta.nome]);

        // 2. Scaliamo le ore dal contratto del docente per congelarle
        const queryUpdateDocente = "UPDATE docenti SET ore_contratto = ore_contratto - ? WHERE id = ?";
        await db.query(queryUpdateDocente, [oreCattedra, docenteScelto.id]);

        console.log("\n=================================================");
        console.log(" ✅ CATTEDRA REGISTRATA CON SUCCESSO!");
        console.log(` Target: ${classeTarget}`);
        console.log(` Materia: ${materiaScelta.nome} (${oreCattedra} ore)`);
        console.log(` Docente: Prof. ${docenteScelto.cognome} ${docenteScelto.nome}`);
        console.log("=================================================\n");

    } catch (err) {
        console.error("\n❌ Errore critico nel database durante l'operazione:", err.message);
    } finally {
        chiudiTutto();
    }
}

function chiudiTutto() {
    rl.close();
    db.end();
}

// Avvia lo script
main();


