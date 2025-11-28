-- Base de datos: biblioteca

-- Compatible con MySQL 5.7 / XAMPP

SET NAMES utf8;

SET time_zone = '+00:00';

SET foreign_key_checks = 0;

SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

CREATE DATABASE IF NOT EXISTS `biblioteca` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE `biblioteca`;

-- ===================================
-- Tabla: usuarios (para autenticación)
-- ===================================
DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100),
  `activo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===================================
-- Tabla: libros
-- ===================================
DROP TABLE IF EXISTS `libros`;

CREATE TABLE `libros` (
  `idLibro` bigint NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `autor` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `fechaPublicacion` date NOT NULL,
  `portada` blob,
  `resena` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`idLibro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `libros` (`idLibro`, `titulo`, `autor`, `fechaPublicacion`, `portada`, `resena`) VALUES
(1, 'El hombre en busca de sentido', 'Viktor Frankl', '1946-01-01', NULL,
 'En esta obra, Viktor E. Frankl explica la experiencia que le llevó al descubrimiento de la logoterapia. Prisionero, durante mucho tiempo, en los desalmados campos de concentración, él mismo sintió en su propio ser lo que significaba una existencia desnuda. ¿Cómo pudo él que todo lo había perdido, que había visto destruir todo lo que valía la pena, que padeció hambre, frío, brutalidades sin fin, que tantas veces estuvo a punto del exterminio, cómo pudo aceptar que la vida fuera digna de vivirla? El psiquiatra que personalmente ha tenido que enfrentarse a tales rigores merece que se le escuche, pues nadie como él para juzgar nuestra condición humana sabia y compasivamente. Las palabras del doctor Frankl alcanzan un temple sorprendentemente esperanzador sobre la capacidad humana de trascender sus dificultades y descubrir la verdad conveniente y orientadora.');

-- ===================================
-- Tabla: calificaciones
-- ===================================
DROP TABLE IF EXISTS `calificaciones`;

CREATE TABLE `calificaciones` (
  `idCalificacion` bigint NOT NULL AUTO_INCREMENT,
  `idLibro` bigint NOT NULL,
  `calificacion` int NOT NULL,
  `resena` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`idCalificacion`),
  KEY `idLibro` (`idLibro`),
  CONSTRAINT `calificaciones_ibfk_1` FOREIGN KEY (`idLibro`) REFERENCES `libros` (`idLibro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `calificaciones` (`idCalificacion`, `idLibro`, `calificacion`, `resena`) VALUES
(1, 1, 5, 'Me gustó este libro.'),
(2, 1, 4, 'Es bueno, pero no es mi favorito.');

-- ===================================
-- Tabla: notificaciones
-- ===================================
DROP TABLE IF EXISTS `notificaciones`;

CREATE TABLE `notificaciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `mensaje` varchar(500) NOT NULL,
  `modulo` varchar(50) NOT NULL,
  `usuario` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET foreign_key_checks = 1;
