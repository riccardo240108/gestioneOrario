const { percorsoFile, db, inizializzaDatabase } = require('./config');
const {
    leggiFile,
    estraiDocenti,
    estraiMappaCodiciMaterie,
    estraiAssegnazioniDocentiMaterie,
    estraiPianiStudio,
} = require('./estrazione');
const {
    stampaCoperturaTotale,
    stampaCoperturaMaterieDettaglio,
    stampaRiepilogoOreAltro,
} = require('./report');

// Nuova inclusione per le articolazioni
const { isMateriaUnita, getOreUnite, getOreSeparate } = require('./articolazioni');

async function main() {
    // 1. Leggi il file di testo tramite config
    const sql = leggiFile(percorsoFile);

    // 2. RIPRISTINO INTEGRALE DELLE TUE RIGHE ORIGINALI (Nessuna modifica protettiva)
    const { anagrafica, totaleOreAltro }  = estraiDocenti(sql);
    const mappaCodici                     = estraiMappaCodiciMaterie(sql);
    const orePerMateria                   = estraiAssegnazioniDocentiMaterie(sql, anagrafica, mappaCodici);
    const { oreRichieste, totaleOreDocenti } = estraiPianiStudio(sql); //! sbagliato.
    const piani = estraiPianiStudio(sql);

    // ======================================================================
    // ADATTAMENTO ASINCRONO PER LE CLASSI ARTICOLATE VIA DATABASE
    // ======================================================================
    try {
        // Controlla ed eventualmente popola le tabelle prima di procedere
        await inizializzaDatabase();
        await db.query("USE scuola1");

        // Recuperiamo le articolazioni dal database relazionale
        const [articolazioni] = await db.execute("SELECT id_articolazione FROM articolazioni");

        for (const art of articolazioni) {
            const idArt = art.id_articolazione;

            for (const nomeMateria in oreRichieste) {
                const codiceMateria = mappaCodici[nomeMateria] || nomeMateria;
                const unita = await isMateriaUnita(db, idArt, nomeMateria);

                if (unita) {
                    const oreSeparate = await getOreSeparate(db, idArt, codiceMateria);
                    const oreUnite = await getOreUnite(db, idArt, nomeMateria);

                    const eccedenza = oreSeparate - oreUnite;
                    if (eccedenza > 0 && oreRichieste[nomeMateria]) {
                        oreRichieste[nomeMateria] -= eccedenza;
                    }
                }
            }
        }
    } catch (errore) {
        console.error("⚠ Controllo articolazioni saltato causa database:", errore.message);
    }
    // ======================================================================

    // 3. Calcolo e stampe originali identiche a prima
    const totaleOrePiani = Object.values(oreRichieste).reduce((a, b) => a + b, 0);

    stampaCoperturaMaterieDettaglio(oreRichieste, orePerMateria);
    stampaRiepilogoOreAltro(anagrafica, totaleOreAltro);
    stampaCoperturaTotale(totaleOreDocenti, totaleOrePiani);

    // Chiude il pool per non lasciare il terminale appeso
    if (db && typeof db.end === 'function') {
        await db.end();
    }
}

main();