const path = require('path');
const mysql = require('mysql2/promise');
const fs = require('fs'); // <-- Nuova inclusione per leggere il dump SQL

const NOME_FILE_SQL = 'scuola2.sql';
const percorsoCompleto = path.join(__dirname, NOME_FILE_SQL);

// Connessione generica al server locale
const db = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '' 
});

// Funzione centralizzata per inizializzare il DB se vuoto
async function inizializzaDatabase() {
    try {
        await db.query("CREATE DATABASE IF NOT EXISTS scuola1");
        await db.query("USE scuola1");

        // Controlliamo se la tabella articolazioni esiste già
        const [tabelle] = await db.query("SHOW TABLES LIKE 'articolazioni'");
        
        // Se non esiste, leggiamo scuola2.sql e lo importiamo nel DB
        if (tabelle.length === 0 && fs.existsSync(percorsoCompleto)) {
            console.log("-> Database vuoto rilevato. Importazione automatica di scuola2.sql in corso...");
            const sqlContenuto = fs.readFileSync(percorsoCompleto, 'utf8');
            
            // Dividiamo il file SQL in singole istruzioni per eseguirle una alla volta
            const istruzioni = sqlContenuto.split(/;\s*$/m);
            for (const istruzione of istruzioni) {
                if (istruzione.trim()) {
                    await db.query(istruzione);
                }
            }
            console.log("-> Importazione completata con successo!");
        }
    } catch (err) {
        console.error("❌ Errore durante l'inizializzazione del database:", err.message);
    }
}

module.exports = {
    percorsoFile: percorsoCompleto,
    db: db,
    inizializzaDatabase: inizializzaDatabase // <-- Esportiamo la funzione di inizializzazione
};