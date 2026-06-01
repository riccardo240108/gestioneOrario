// articolazioni.js

// ======================================================================
// SEZIONE 1 — QUERY SQL
// ======================================================================
const queryOreUnite = `
    SELECT ps.ore_settimanali
    FROM articolazioni_materie am
    JOIN articolazioni_classi ac ON ac.id_articolazione = am.id_articolazione
    JOIN classi c ON c.nome_classe = ac.nome_classe
    JOIN pianos_studi ps ON ps.indirizzo = c.indirizzo AND ps.nome_materia = am.nome_materia
    WHERE am.id_articolazione = ?
      AND am.nome_materia = ?
    LIMIT 1;
`;

const queryOreSeparate = `
    SELECT ps.ore_settimanali
    FROM articolazioni_classi ac
    JOIN classi c ON c.nome_classe = ac.nome_classe
    JOIN piani_studi ps ON ps.indirizzo = c.indirizzo
    WHERE ac.id_articolazione = ?
      AND ps.codice_materia = ?; 
`; // Nota: se anche in piani_studi usi il nome, sostituisci ps.codice_materia con ps.nome_materia

const queryMateriaUnita = `
    SELECT 1
    FROM articolazioni_materie
    WHERE id_articolazione = ?
      AND nome_materia = ?
    LIMIT 1;
`;

// ======================================================================
// SEZIONE 2 — FUNZIONI CHE ESEGUONO LE QUERY
// ======================================================================
async function getOreUnite(db, idArticolazione, nomeMateria) {
    const [rows] = await db.execute(queryOreUnite, [idArticolazione, nomeMateria]);
    return rows.length > 0 ? rows[0].ore_settimanali : 0;
}

async function getOreSeparate(db, idArticolazione, codiceMateria) {
    const [rows] = await db.execute(queryOreSeparate, [idArticolazione, codiceMateria]);
    let totale = 0;
    for (const r of rows) {
        totale += r.ore_settimanali;
    }
    return totale;
}

async function isMateriaUnita(db, idArticolazione, nomeMateria) {
    const [rows] = await db.execute(queryMateriaUnita, [idArticolazione, nomeMateria]);
    return rows.length > 0;
}

// ======================================================================
// SEZIONE 3 — MEGAFUNZIONE
// ======================================================================
async function calcolaOreMateria(db, idArticolazione, nomeMateria, codiceMateria) {
    const unita = await isMateriaUnita(db, idArticolazione, nomeMateria);

    if (unita) {
        return await getOreUnite(db, idArticolazione, nomeMateria);
    } else {
        return await getOreSeparate(db, idArticolazione, codiceMateria);
    }
}

module.exports = {
    getOreUnite,
    getOreSeparate,
    isMateriaUnita,
    calcolaOreMateria
};