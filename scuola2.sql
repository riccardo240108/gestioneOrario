-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Creato il: Mag 18, 2026 alle 16:44
-- Versione del server: 10.4.28-MariaDB
-- Versione PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `scuola1`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `cattedre`
--

CREATE TABLE `cattedre` (
  `docente_id` int(11) NOT NULL,
  `nome_classe` varchar(10) NOT NULL,
  `nome_materia` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `cattedre`
--

INSERT INTO `cattedre` (`docente_id`, `nome_classe`, `nome_materia`) VALUES
(1, '1A', 'Fisica'),
(1, '1A', 'Matematica'),
(1, '1B', 'Matematica'),
(2, '1A', 'Lingua e letteratura italiana');

-- --------------------------------------------------------

--
-- Struttura della tabella `classi`
--

CREATE TABLE `classi` (
  `nome_classe` varchar(10) NOT NULL,
  `indirizzo` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `classi`
--

INSERT INTO `classi` (`nome_classe`, `indirizzo`) VALUES
('1A', 'Scientifico_biennio_comune'),
('1B', 'Scientifico_biennio_comune'),
('1C', 'Scientifico_biennio_comune'),
('1D', 'Scientifico_biennio_comune'),
('1E', 'Scientifico_biennio_comune'),
('2A', 'Scientifico_biennio_comune'),
('2B', 'Scientifico_biennio_comune'),
('2C', 'Scientifico_biennio_comune'),
('2D', 'Scientifico_biennio_comune'),
('2E', 'Scientifico_biennio_comune'),
('3A', 'Scientifico_doppiaLingua'),
('3B', 'Scientifico_tradizionale'),
('3C', 'Scientifico_scienze_applicate'),
('3D', 'Scientifico_scienze_applicate'),
('3E', 'Scientifico_scienze_applicate'),
('4A', 'Scientifico_doppiaLingua'),
('4B', 'Scientifico_tradizionale'),
('4C', 'Scientifico_scienze_applicate'),
('4D', 'Scientifico_scienze_applicate'),
('4E', 'Scientifico_scienze_applicate'),
('5A', 'Scientifico_doppiaLingua'),
('5B', 'Scientifico_tradizionale'),
('5C', 'Scientifico_scienze_applicate'),
('5D', 'Scientifico_scienze_applicate'),
('5E', 'Scientifico_scienze_applicate');

-- --------------------------------------------------------

--
-- Struttura della tabella `docenti`
--

CREATE TABLE `docenti` (
  `id` int(11) NOT NULL,
  `cognome` varchar(100) DEFAULT NULL,
  `nome` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `ore_contratto` int(11) DEFAULT NULL,
  `tipo_contratto` enum('di ruolo','sostituto','non di ruolo') DEFAULT 'di ruolo',
  `sostituisce_id` int(11) DEFAULT NULL,
  `ore_altro` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `docenti`
--

INSERT INTO `docenti` (`id`, `cognome`, `nome`, `email`, `ore_contratto`, `tipo_contratto`, `sostituisce_id`, `ore_altro`) VALUES
(1, 'Agostini', 'Nadia', 'agostini.nadia@liceorussell.eu', 9, 'di ruolo', NULL, '5'),
(2, 'Andaloro', 'Stefano', 'andaloro.stefano@liceorussell.eu', 10, 'di ruolo', NULL, '4'),
(3, 'Angeli', 'Livio', 'angeli.livio@liceorussell.eu', 18, 'di ruolo', NULL, '10'),
(4, 'Anniciello', 'Patrizia', 'anniciello.patrizia@liceorussell.eu', 18, 'di ruolo', NULL, '9'),
(5, 'Apolloni', 'Giovanna', 'apolloni.giovanna@liceorussell.eu', 5, 'di ruolo', NULL, '0'),
(6, 'Bandera', 'William', 'bandera.william@liceorussell.eu', 18, 'di ruolo', NULL, '6'),
(7, 'Bernardinatti', 'Barbara', 'bernardinatti.barbara@liceorussell.eu', 18, 'di ruolo', NULL, NULL),
(8, 'Bertolini', 'Claudia', 'bertolini.claudia@liceorussell.eu', 18, 'di ruolo', NULL, NULL),
(9, 'Blasiol', 'Marcella', 'blasiol.marcella@liceorussell.eu', 9, 'di ruolo', NULL, NULL),
(10, 'Brentari', 'Elena', 'brentari.elena@liceorussell.eu', 10, 'di ruolo', NULL, NULL);

-- --------------------------------------------------------

--
-- Struttura della tabella `docenti_materie`
--

CREATE TABLE `docenti_materie` (
  `docente_id` int(11) NOT NULL,
  `nome_materia` varchar(100) NOT NULL,
  `ore` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `docenti_materie`
--

INSERT INTO `docenti_materie` (`docente_id`, `nome_materia`, `ore`) VALUES
(1, 'Lingua e cultura latina', 10),
(1, 'Lingua e cultura latina', 10),
(1, 'Lingua e letteratura italiana', 9),
(2, 'Lingua e letteratura italiana', 14),
(2, 'Storia e geografia', 11),
(3, 'Lingua e cultura greca', 8),
(3, 'Lingua e cultura latina', 9),
(3, 'Lingua e letteratura italiana', 5),
(4, 'Fisica', 9),
(4, 'Matematica', 9),
(5, 'Scienze naturali (biologia, chimica, scienze della terra)', 18),
(6, 'Disegno e storia dell\'arte', 12),
(6, 'Storia dell\'arte', 6);

-- --------------------------------------------------------

--
-- Struttura della tabella `materie`
--

CREATE TABLE `materie` (
  `nome_materia` varchar(100) NOT NULL,
  `codice_edt` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `materie`
--

INSERT INTO `materie` (`nome_materia`, `codice_edt`) VALUES
('Diritto ed economia', 'DIREC'),
('Diritto ed economia politica', 'DIRITT'),
('Disegno e storia dell\'arte', 'DIS'),
('Filosofia', 'FIL'),
('Fisica', 'FIS'),
('Lingua e cultura greca', 'GRE'),
('Lingua e cultura latina', 'LAT'),
('Lingua e cultura straniera francese', 'FRA'),
('Lingua e cultura straniera inglese', 'ING'),
('Lingua e cultura straniera spagnola', 'SPA'),
('Lingua e cultura straniera tedesca', 'TED'),
('Lingua e letteratura italiana', 'ITA'),
('Lingua latina', 'LIN'),
('Matematica', 'MAT'),
('Scienze naturali (biologia, chimica, scienze della terra)', 'SCINat'),
('Scienze umane', 'SCIUma'),
('Storia', 'STO'),
('Storia dell\'arte', 'STOArte'),
('Storia e geografia', 'STOGEO');

-- --------------------------------------------------------

--
-- Struttura della tabella `piani_studi`
--

CREATE TABLE `piani_studi` (
  `indirizzo` varchar(100) NOT NULL,
  `anno` int(11) NOT NULL,
  `codice_materia` varchar(20) NOT NULL,
  `ore_settimanali` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `piani_studi`
--

INSERT INTO `piani_studi` (`indirizzo`, `anno`, `codice_materia`, `ore_settimanali`) VALUES
('Classico', 1, 'GRE', 9),
('Classico', 1, 'ITA', 5),
('Classico', 1, 'LAT', 8),
('Classico', 2, 'GRE', 4),
('Classico', 2, 'ITA', 15),
('Classico', 2, 'LAT', 5),
('Classico', 3, 'GRE', 7),
('Classico', 3, 'ITA', 4),
('Classico', 3, 'LAT', 11),
('Classico', 4, 'GRE', 10),
('Classico', 4, 'ITA', 5),
('Classico', 4, 'LAT', 4),
('Classico', 5, 'GRE', 13),
('Classico', 5, 'ITA', 4),
('Classico', 5, 'LAT', 7);

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `cattedre`
--
ALTER TABLE `cattedre`
  ADD PRIMARY KEY (`docente_id`,`nome_classe`,`nome_materia`),
  ADD KEY `nome_classe` (`nome_classe`),
  ADD KEY `nome_materia` (`nome_materia`);

--
-- Indici per le tabelle `classi`
--
ALTER TABLE `classi`
  ADD PRIMARY KEY (`nome_classe`);

--
-- Indici per le tabelle `docenti`
--
ALTER TABLE `docenti`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sostituisce_id` (`sostituisce_id`);

--
-- Indici per le tabelle `docenti_materie`
--
ALTER TABLE `docenti_materie`
  ADD PRIMARY KEY (`docente_id`,`nome_materia`),
  ADD KEY `nome_materia` (`nome_materia`);

--
-- Indici per le tabelle `materie`
--
ALTER TABLE `materie`
  ADD PRIMARY KEY (`nome_materia`);

--
-- Indici per le tabelle `piani_studi`
--
ALTER TABLE `piani_studi`
  ADD PRIMARY KEY (`indirizzo`,`anno`,`codice_materia`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `docenti`
--
ALTER TABLE `docenti`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `cattedre`
--
ALTER TABLE `cattedre`
  ADD CONSTRAINT `cattedre_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `docenti` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cattedre_ibfk_2` FOREIGN KEY (`nome_classe`) REFERENCES `classi` (`nome_classe`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cattedre_ibfk_3` FOREIGN KEY (`nome_materia`) REFERENCES `materie` (`nome_materia`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Limiti per la tabella `docenti`
--
ALTER TABLE `docenti`
  ADD CONSTRAINT `docenti_ibfk_1` FOREIGN KEY (`sostituisce_id`) REFERENCES `docenti` (`id`);

--
-- Limiti per la tabella `docenti_materie`
--
ALTER TABLE `docenti_materie`
  ADD CONSTRAINT `docenti_materie_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `docenti` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `docenti_materie_ibfk_2` FOREIGN KEY (`nome_materia`) REFERENCES `materie` (`nome_materia`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
