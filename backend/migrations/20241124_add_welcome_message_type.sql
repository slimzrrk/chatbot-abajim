-- Migration pour ajouter la colonne message_type avec support pour 'welcome'
-- Date: 2024-11-24

-- Ajouter la colonne message_type avec les valeurs text, audio, welcome
ALTER TABLE chatbot_interactions
ADD COLUMN message_type ENUM('text', 'audio', 'welcome') NOT NULL DEFAULT 'text' AFTER tts;

-- Ajouter les colonnes audio manquantes
ALTER TABLE chatbot_interactions
ADD COLUMN audio_path VARCHAR(255) NULL COMMENT 'Chemin vers le fichier audio du message utilisateur' AFTER message_type;

ALTER TABLE chatbot_interactions
ADD COLUMN audio_duration INT NULL COMMENT 'Durée du message audio en millisecondes' AFTER audio_path;

ALTER TABLE chatbot_interactions
ADD COLUMN audio_size INT NULL COMMENT 'Taille du fichier audio en bytes' AFTER audio_duration;

-- Ajouter les colonnes pour les entités manquantes
ALTER TABLE chatbot_interactions
ADD COLUMN manuelName VARCHAR(255) NULL AFTER niveau;

ALTER TABLE chatbot_interactions
ADD COLUMN page INT NULL AFTER manuelName;

ALTER TABLE chatbot_interactions
ADD COLUMN teacherFirstName VARCHAR(255) NULL AFTER page;

ALTER TABLE chatbot_interactions
ADD COLUMN teacherLastName VARCHAR(255) NULL AFTER teacherFirstName;

-- Vérifier que la modification a été appliquée
DESCRIBE chatbot_interactions;
