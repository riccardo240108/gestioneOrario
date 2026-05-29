function stampaCoperturaTotale(totaleOreDocenti, totaleOrePiani) {
  console.log(`Totale ore disponibili (Docenti): ${totaleOreDocenti}`);
  console.log(`Totale ore richieste (Piani Studio): ${totaleOrePiani}`);
  console.log("---------------------------------------");

  if (totaleOreDocenti >= totaleOrePiani) {
      console.log("Siamo apposto");
      return true;
  } else {
      console.log(`Richiedere ${totaleOrePiani - totaleOreDocenti} ore`);
      return false;
  }
}

function stampaCoperturaMaterieDettaglio(oreRichieste, orePerMateria) {
  console.log("=================================================");
  console.log("   ANALISI COPERTURA REALE DALLE CATTEDRE       ");
  console.log("=================================================\n");

  for (const materia in oreRichieste) {
      const oreNecessarie = oreRichieste[materia];
      const docenti = orePerMateria[materia] || [];
      let oreCoperte = 0;

      console.log(`MATERIA: ${materia}`);
      console.log(`-> Ore totali richieste: ${oreNecessarie}`);
      console.log(`-> Docenti assegnati (${docenti.length}):`);

      if (docenti.length > 0) {
          docenti.forEach(d => {
              console.log(`   - [ID: ${d.id}] ${d.cognome} ${d.nome} -> ${d.oreAssegnate} ore`);
              oreCoperte += d.oreAssegnate;
          });
      } else {
          console.log("   - ⚠ NESSUN DOCENTE ASSEGNATO");
      }

      if (oreCoperte >= oreNecessarie) {
          console.log(`   ✅ COPERTA (Assegnate: ${oreCoperte} | Richieste: ${oreNecessarie})`);
      } else {
          console.log(`   ❌ SCOPERTA! Mancano ${oreNecessarie - oreCoperte} ore`);
      }
      console.log("-------------------------------------------------");
  }
}

function stampaRiepilogoOreAltro(anagrafica, totaleOreAltro) {
  console.log("\n=================================================");
  console.log("   RIEPILOGO ORE DESTINATE AD ALTRO            ");
  console.log("=================================================");

  for (const id in anagrafica) {
      const doc = anagrafica[id];
      if (doc.ore_altro > 0) {
          console.log(`   - ${doc.cognome} ${doc.nome} (ID: ${id}) -> ${doc.ore_altro} ore`);
      }
  }

  console.log(`-> Totale complessivo 'ore_altro': ${totaleOreAltro}`);
  console.log("=================================================\n");
}

module.exports = {
  stampaCoperturaTotale,
  stampaCoperturaMaterieDettaglio,
  stampaRiepilogoOreAltro,
};