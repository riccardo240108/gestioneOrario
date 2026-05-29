const { percorsoFile } = require('./config');
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

const sql = leggiFile(percorsoFile);

const { anagrafica, totaleOreAltro }  = estraiDocenti(sql);
const mappaCodici                     = estraiMappaCodiciMaterie(sql);
const orePerMateria                   = estraiAssegnazioniDocentiMaterie(sql, anagrafica, mappaCodici);
const { oreRichieste, totaleOreDocenti } = estraiPianiStudio(sql); //! sbagliato.
const piani = estraiPianiStudio(sql);

const totaleOrePiani = Object.values(oreRichieste).reduce((a, b) => a + b, 0);

stampaCoperturaMaterieDettaglio(oreRichieste, orePerMateria);
stampaRiepilogoOreAltro(anagrafica, totaleOreAltro);
stampaCoperturaTotale(totaleOreDocenti, totaleOrePiani);