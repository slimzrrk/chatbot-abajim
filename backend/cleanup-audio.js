#!/usr/bin/env node

/**
 * Script de nettoyage des fichiers audio
 * Supprime les anciens fichiers audio pour éviter l'accumulation
 */

const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const MAX_FILES = 50; // Garder seulement les 50 fichiers les plus récents

function cleanupAudioFiles() {
    try {
        if (!fs.existsSync(UPLOADS_DIR)) {
            console.log('📁 Dossier uploads non trouvé, rien à nettoyer');
            return;
        }

        // Lire tous les fichiers audio
        const files = fs.readdirSync(UPLOADS_DIR)
            .filter(file => file.match(/\.(mp3|wav|m4a)$/i))
            .map(file => {
                const filePath = path.join(UPLOADS_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: filePath,
                    mtime: stats.mtime.getTime(),
                    size: stats.size
                };
            })
            .sort((a, b) => b.mtime - a.mtime); // Trier du plus récent au plus ancien

        console.log(`📊 Trouvé ${files.length} fichiers audio`);

        if (files.length <= MAX_FILES) {
            console.log(`✅ Nombre de fichiers OK (${files.length}/${MAX_FILES}), aucun nettoyage nécessaire`);
            return;
        }

        // Supprimer les fichiers en excès
        const filesToDelete = files.slice(MAX_FILES);
        let totalSizeDeleted = 0;

        console.log(`🧹 Suppression de ${filesToDelete.length} anciens fichiers...`);

        filesToDelete.forEach(file => {
            try {
                fs.unlinkSync(file.path);
                totalSizeDeleted += file.size;
                console.log(`🗑️ Supprimé: ${file.name}`);
            } catch (error) {
                console.error(`❌ Erreur lors de la suppression de ${file.name}:`, error.message);
            }
        });

        const sizeMB = (totalSizeDeleted / (1024 * 1024)).toFixed(2);
        console.log(`✅ Nettoyage terminé: ${filesToDelete.length} fichiers supprimés (${sizeMB} MB libérés)`);

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
    }
}

// Exécuter le nettoyage
if (require.main === module) {
    console.log('🧹 Démarrage du nettoyage des fichiers audio...');
    cleanupAudioFiles();
}

module.exports = { cleanupAudioFiles };
