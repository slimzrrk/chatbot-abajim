-- Migration pour modifier l'ENUM message_type pour inclure 'welcome'
-- Date: 2024-11-24

-- Modifier la colonne message_type pour inclure 'welcome'
ALTER TABLE chatbot_interactions 
MODIFY COLUMN message_type ENUM('text', 'audio', 'welcome') NOT NULL DEFAULT 'text';

-- Vérifier que la modification a été appliquée
DESCRIBE chatbot_interactions;
