// Esempio di logica per calcolare il gap orario
function calcolaFabbisogno(docenti, classi, pianiStudi) {
    let fabbisognoTotale = {}; // Mappa: Materia -> Ore Totali Necessarie
    let offertaTotale = {};    // Mappa: Materia -> Ore Docenti Disponibili

    // 1. Calcola quante ore servono in totale basandosi sulle classi attive
    classi.forEach(classe => {
        const anno = parseInt(classe.nome_classe[0]); // Es: "1A" -> 1
        const materieDellaClasse = pianiStudi.filter(p => 
            p.indirizzo === classe.indirizzo && p.anno === anno
        );

        materieDellaClasse.forEach(m => {
            fabbisognoTotale[m.codice_edt] = (fabbisognoTotale[m.codice_edt] || 0) + m.ore_previste;
        });
    });

    // 2. Calcola le ore coperte dai docenti attuali (escludendo sostituti se necessario)
    docenti.forEach(docente => {
        // Qui andrebbe incrociato con le abilitazioni (abilitazioni_docenti.csv)
        // Per semplicità usiamo il totale ore contratto
        const ruolo = docente.tipo_contratto; 
        // Logica per determinare su quale materia pesano le ore...
    });

    return fabbisognoTotale;
}scuo