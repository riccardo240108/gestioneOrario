# gestioneOrario


# manca colonna in docenti dove n ore sono assegnate come "altro"

UPDATE docenti AS t1
JOIN docenti_materie AS t2 ON t1.id= t2.docente_id
SET t1.ore_altro = t1.ore_contratto - t2.ore;

# formula usata per popolare la colonna "ore_altro" nella tabella docenti.
# ccontare ora le ore che copre ogni prof basandosi solo sulle ore che copre per ogni materia (dovrebbe già farlo ma controlla) 