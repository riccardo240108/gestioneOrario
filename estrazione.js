const fs = require('fs');
const Docente = require('./oggetti/Docente');
const PianoStudio = require('./oggetti/PianoStudio');

function leggiFile(pathFile) {
    return fs.readFileSync(pathFile, 'utf8');
}

function estraiDocenti(contenutoSql) {
    const anagrafica = {};
    // (id, 'cognome', 'nome', 'email', ore_contratto, 'tipo_contratto', NULL/numero, NULL/'ore_altro')
    const regex = /\((\d+),\s*'([^']+)',\s*'([^']+)',\s*'[^']+',\s*(\d+),\s*'(?:di ruolo|sostituto|non di ruolo)',\s*(?:NULL|\d+),\s*(?:NULL|'(\d+)')\)/g;
    let match;

    while ((match = regex.exec(contenutoSql)) !== null) {
        const docente = new Docente(
            match[1],
            match[2],
            match[3],
            parseInt(match[4], 10),
            parseInt(match[5], 10) || 0   // match[5] è undefined se NULL → diventa 0
        );
        anagrafica[docente.id] = docente;
    }

    return anagrafica;
}

function estraiMappaCodiciMaterie(contenutoSql) {
    const mappa = {};
    const regex = /\('([^']+)',\s*'([^']*)'\)/g;
    let match;

    while ((match = regex.exec(contenutoSql)) !== null) {
        mappa[match[1]] = match[2];
    }

    return mappa;  // non serve più l'override manuale, 'ITA' è già nel SQL
}

function estraiAssegnazioniDocentiMaterie(contenutoSql, anagrafica, mappaCodici) {
    const orePerMateria = {};

    // Isola solo il blocco INSERT di docenti_materie, così il regex non scappa su altre tabelle
    const blocco = contenutoSql.match(/INSERT INTO `docenti_materie`.*?VALUES([\s\S]*?);/);
    console.log('blocco trovato:', blocco ? blocco[1] : 'NESSUNO');
    if (!blocco) return orePerMateria;

    const regex = /\((\d+),\s*'((?:[^'\\]|\\.)*)' ,\s*(\d+)\)/g;
    let match;

    while ((match = regex.exec(blocco[1])) !== null) {
        const docenteId = match[1];
        const nomeMateria = match[2];
        const oreAssegnate = parseInt(match[3], 10);

        const codice = mappaCodici[nomeMateria] || nomeMateria;
        const doc = anagrafica[docenteId];

        if (!orePerMateria[codice]) orePerMateria[codice] = [];

        orePerMateria[codice].push({ docente: doc, oreAssegnate });
    }

    return orePerMateria;
}

function estraiPianiStudio(contenutoSql) {
    const piani = [];

    // Isola solo il blocco INSERT di piani_studi
    const blocco = contenutoSql.match(/INSERT INTO `piani_studi`.*?VALUES([\s\S]*?);/);
    if (!blocco) return piani;

    const regex = /\('[^']+',\s*(\d+),\s*'([^']+)',\s*(\d+)\)/g;
    let match;

    while ((match = regex.exec(blocco[1])) !== null) {
        piani.push(new PianoStudio(match[2], parseInt(match[3], 10)));
    }

    return piani;
}

module.exports = {
    leggiFile,
    estraiDocenti,
    estraiMappaCodiciMaterie,
    estraiAssegnazioniDocentiMaterie,
    estraiPianiStudio,
};