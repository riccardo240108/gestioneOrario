-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
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
CREATE DATABASE IF NOT EXISTS `scuola1` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `scuola1`;

-- --------------------------------------------------------
-- Struttura della tabella `articolazioni`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `articolazioni_materie`;
DROP TABLE IF EXISTS `articolazioni_classi`;
DROP TABLE IF EXISTS `articolazioni`;

CREATE TABLE `articolazioni` (
  `id_articolazione` int(11) NOT NULL AUTO_INCREMENT,
  `nome_articolazione` varchar(50) NOT NULL,
  PRIMARY KEY (`id_articolazione`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `articolazioni` (`id_articolazione`, `nome_articolazione`) VALUES
(1, '4B-4E');

-- --------------------------------------------------------
-- Struttura della tabella `materie`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cattedre`;
DROP TABLE IF EXISTS `docenti_materie`;
DROP TABLE IF EXISTS `materie`;

CREATE TABLE `materie` (
  `nome_materia` varchar(100) NOT NULL,
  `codice_edt` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`nome_materia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Struttura della tabella `classi`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `classi`;
CREATE TABLE `classi` (
  `nome_classe` varchar(10) NOT NULL,
  `indirizzo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`nome_classe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Struttura della tabella `articolazioni_classi`
-- --------------------------------------------------------
CREATE TABLE `articolazioni_classi` (
  `id_articolazione` int(11) NOT NULL,
  `nome_classe` varchar(10) NOT NULL,
  KEY `id_articolazione` (`id_articolazione`),
  KEY `nome_classe` (`nome_classe`),
  CONSTRAINT `articolazioni_classi_ibfk_1` FOREIGN KEY (`id_articolazione`) REFERENCES `articolazioni` (`id_articolazione`) ON DELETE CASCADE,
  CONSTRAINT `articolazioni_classi_ibfk_2` FOREIGN KEY (`nome_classe`) REFERENCES `classi` (`nome_classe`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `articolazioni_classi` (`id_articolazione`, `nome_classe`) VALUES
(1, '4B'),
(1, '4E');

-- --------------------------------------------------------
-- Struttura della tabella `articolazioni_materie`
-- --------------------------------------------------------
CREATE TABLE `articolazioni_materie` (
  `id_articolazione` int(11) NOT NULL,
  `nome_materia` varchar(100) NOT NULL,
  PRIMARY KEY (`id_articolazione`,`nome_materia`),
  KEY `nome_materia` (`nome_materia`),
  CONSTRAINT `articolazioni_materie_ibfk_1` FOREIGN KEY (`id_articolazione`) REFERENCES `articolazioni` (`id_articolazione`) ON DELETE CASCADE,
  CONSTRAINT `articolazioni_materie_ibfk_2` FOREIGN KEY (`nome_materia`) REFERENCES `materie` (`nome_materia`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `articolazioni_materie` (`id_articolazione`, `nome_materia`) VALUES
(1, 'Matematica');

-- --------------------------------------------------------
-- Struttura della tabella `docenti`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `docenti`;
CREATE TABLE `docenti` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cognome` varchar(100) DEFAULT NULL,
  `nome` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `ore_contratto` int(11) DEFAULT NULL,
  `tipo_contratto` enum('di ruolo','sostituto','non di ruolo') DEFAULT 'di ruolo',
  `sostituisce_id` int(11) DEFAULT NULL,
  `ore_altro` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sostituisce_id` (`sostituisce_id`),
  CONSTRAINT `docenti_ibfk_1` FOREIGN KEY (`sostituisce_id`) REFERENCES `docenti` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `docenti` (`id`, `cognome`, `nome`, `email`, `ore_contratto`, `tipo_contratto`, `sostituisce_id`, `ore_altro`) VALUES
(1, 'Agostini', 'Nadia', 'agostini.nadia@liceorussell.eu', 18, 'di ruolo', NULL, 5),
(2, 'Andaloro', 'Stefano', 'andaloro.stefano@liceorussell.eu', 18, 'di ruolo', NULL, 4),
(3, 'Angeli', 'Livio', 'angeli.livio@liceorussell.eu', 18, 'di ruolo', NULL, 10),
(4, 'Anniciello', 'Patrizia', 'anniciello.patrizia@liceorussell.eu', 24, 'di ruolo', NULL, 9),
(5, 'Apolloni', 'Giovanna', 'apolloni.giovanna@liceorussell.eu', 5, 'di ruolo', NULL, 0),
(6, 'Bandera', 'William', 'bandera.william@liceorussell.eu', 18, 'di ruolo', NULL, 6),
(7, 'Bernardinatti', 'Barbara', 'bernardinatti.barbara@liceorussell.eu', 18, 'di ruolo', NULL, NULL),
(8, 'Bertolini', 'Claudia', 'bertolini.claudia@liceorussell.eu', 18, 'di ruolo', NULL, NULL),
(9, 'Blasiol', 'Marcella', 'blasiol.marcella@liceorussell.eu', 9, 'di ruolo', NULL, NULL),
(10, 'Brentari', 'Elena', 'brentari.elena@liceorussell.eu', 10, 'di ruolo', NULL, NULL),

(11, 'Rossi', 'Mario', 'mario.rossi@liceorussell.eu', 18, 'di ruolo', NULL, 0),
(12, 'Ferrari', 'Elena', 'elena.ferrari@liceorussell.eu', 18, 'di ruolo', NULL, 5),
(13, 'Bianchi', 'Luigi', 'luigi.bianchi@liceorussell.eu', 18, 'di ruolo', NULL, 0),
(14, 'Colombo', 'Silvia', 'silvia.colombo@liceorussell.eu', 18, 'di ruolo', NULL, 0),
(15, 'Marini', 'Anna', 'anna.marini@liceorussell.eu', 18, 'di ruolo', NULL, 11),
(16, 'Ricci', 'Paolo', 'paolo.ricci@liceorussell.eu', 18, 'di ruolo', NULL, 0),
(17, 'Bruno', 'Laura', 'laura.bruno@liceorussell.eu', 18, 'di ruolo', NULL, 3),

-- NUOVI DOCENTI PER MATEMATICA
(18, 'Galli', 'Roberto', 'roberto.galli@liceorussell.eu', 18, 'di ruolo', NULL, 2),
(19, 'Conti', 'Lucia', 'lucia.conti@liceorussell.eu', 18, 'di ruolo', NULL, 0),
(20, 'Barbieri', 'Andrea', 'andrea.barbieri@liceorussell.eu', 18, 'di ruolo', NULL, 9),
(21, 'Fontana', 'Francesca', 'francesca.fontana@liceorussell.eu', 18, 'di ruolo', NULL, 0),
(22, 'Serra', 'Matteo', 'matteo.serra@liceorussell.eu', 18, 'di ruolo', NULL, 0),

-- NUOVI DOCENTI PER DISEGNO E STORIA DELL\'ARTE
(23, 'Longo', 'Chiara', 'chiara.longo@liceorussell.eu', 18, 'di ruolo', NULL, 0),
(24, 'Russo', 'Fabio', 'fabio.russo@liceorussell.eu', 18, 'di ruolo', NULL, 0),
(25, 'Costa', 'Giulia', 'giulia.costa@liceorussell.eu', 18, 'di ruolo', NULL, 0),
(26, 'Piras', 'Alessandro', 'alessandro.piras@liceorussell.eu', 18, 'di ruolo', NULL, 0);

-- --------------------------------------------------------
-- Struttura della tabella `docenti_materie`
-- --------------------------------------------------------
CREATE TABLE `docenti_materie` (
  `docente_id` int(11) NOT NULL,
  `nome_materia` varchar(100) NOT NULL,
  `ore` int(11) DEFAULT NULL,
  PRIMARY KEY (`docente_id`,`nome_materia`),
  KEY `nome_materia` (`nome_materia`),
  CONSTRAINT `docenti_materie_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `docenti` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `docenti_materie_ibfk_2` FOREIGN KEY (`nome_materia`) REFERENCES `materie` (`nome_materia`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `docenti_materie` (`docente_id`, `nome_materia`, `ore`) VALUES
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
-- Struttura della tabella `cattedre`
-- --------------------------------------------------------
CREATE TABLE `cattedre` (
  `docente_id` int(11) NOT NULL,
  `nome_classe` varchar(10) NOT NULL,
  `nome_materia` varchar(100) NOT NULL,
  PRIMARY KEY (`docente_id`,`nome_classe`,`nome_materia`),
  KEY `nome_classe` (`nome_classe`),
  KEY `nome_materia` (`nome_materia`),
  CONSTRAINT `cattedre_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `docenti` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cattedre_ibfk_2` FOREIGN KEY (`nome_classe`) REFERENCES `classi` (`nome_classe`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cattedre_ibfk_3` FOREIGN KEY (`nome_materia`) REFERENCES `materie` (`nome_materia`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `cattedre` (`docente_id`, `nome_classe`, `nome_materia`) VALUES
(1, '1A', 'Lingua e letteratura italiana'),
(1, '1B', 'Lingua e cultura latina'),
(2, '1B', 'Lingua e letteratura italiana'),
(2, '2A', 'Storia e geografia'),
(4, '1A', 'Matematica'),
(4, '1B', 'Matematica'),
(4, '4B', 'Matematica'), 
(4, '4E', 'Matematica'),
(6, '5B', 'Disegno e storia dell\'arte');

-- --------------------------------------------------------
-- Struttura della tabella `piani_studi`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `piani_studi`;
CREATE TABLE `piani_studi` (
  `indirizzo` varchar(100) NOT NULL,
  `anno` int(11) NOT NULL,
  `codice_materia` varchar(20) NOT NULL,
  `ore_settimanali` int(11) DEFAULT NULL,
  PRIMARY KEY (`indirizzo`,`anno`,`codice_materia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `piani_studi` (`indirizzo`, `anno`, `codice_materia`, `ore_settimanali`) VALUES
-- Scientifico biennio comune
('Scientifico_biennio_comune', 1, 'ITA', 4),
('Scientifico_biennio_comune', 1, 'LAT', 3),
('Scientifico_biennio_comune', 1, 'MAT', 5),
('Scientifico_biennio_comune', 2, 'ITA', 4),
('Scientifico_biennio_comune', 2, 'STOGEO', 3),
('Scientifico_biennio_comune', 2, 'MAT', 5),

-- Scientifico tradizionale
('Scientifico_tradizionale', 3, 'ITA', 4),
('Scientifico_tradizionale', 3, 'MAT', 4),
('Scientifico_tradizionale', 4, 'ITA', 4),
('Scientifico_tradizionale', 4, 'MAT', 4),
('Scientifico_tradizionale', 5, 'ITA', 4),
('Scientifico_tradizionale', 5, 'MAT', 4),

-- Scientifico scienze applicate
('Scientifico_scienze_applicate', 3, 'ITA', 4),
('Scientifico_scienze_applicate', 3, 'MAT', 4),
('Scientifico_scienze_applicate', 4, 'ITA', 4),
('Scientifico_scienze_applicate', 4, 'MAT', 4),
('Scientifico_scienze_applicate', 4, 'SCINat', 5),
('Scientifico_scienze_applicate', 5, 'ITA', 4),
('Scientifico_scienze_applicate', 5, 'MAT', 4),

-- Scientifico doppia lingua
('Scientifico_doppiaLingua', 3, 'ITA', 4),
('Scientifico_doppiaLingua', 3, 'MAT', 4),
('Scientifico_doppiaLingua', 4, 'ITA', 4),
('Scientifico_doppiaLingua', 4, 'MAT', 4),
('Scientifico_doppiaLingua', 5, 'ITA', 4),
('Scientifico_doppiaLingua', 5, 'MAT', 4);

COMMIT;