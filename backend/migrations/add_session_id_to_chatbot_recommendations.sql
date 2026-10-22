-- Migration pour ajouter la colonne session_id à la table chatbot_recommendations
-- Si la table n'existe pas, la créer
CREATE TABLE IF NOT EXISTS `chatbot_recommendations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `session_id` VARCHAR(255) NOT NULL,
  `recommendation_type` ENUM('teacher', 'course', 'exercise') NOT NULL,
  `recommendations_data` LONGTEXT NOT NULL,
  `current_index` INT NOT NULL DEFAULT 0,
  `matiere_name` VARCHAR(255),
  `level_id` INT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Si la table existe déjà mais n'a pas la colonne session_id, l'ajouter
SET @exist := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'abajimdb'
  AND TABLE_NAME = 'chatbot_recommendations'
  AND COLUMN_NAME = 'session_id'
);

SET @query := IF(
  @exist = 0,
  'ALTER TABLE `chatbot_recommendations` ADD COLUMN `session_id` VARCHAR(255) NOT NULL AFTER `user_id`',
  'SELECT "Column session_id already exists in chatbot_recommendations table"'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Si la table existe déjà et a la colonne uuid, la supprimer
SET @exist := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'abajimdb'
  AND TABLE_NAME = 'chatbot_recommendations'
  AND COLUMN_NAME = 'uuid'
);

SET @query := IF(
  @exist > 0,
  'ALTER TABLE `chatbot_recommendations` DROP COLUMN `uuid`',
  'SELECT "Column uuid does not exist in chatbot_recommendations table"'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
