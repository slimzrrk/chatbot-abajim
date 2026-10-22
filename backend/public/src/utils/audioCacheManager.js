/**
 * Gestionnaire de cache audio
 * Ce module gère le cache des fichiers audio et assure que les fichiers les plus récents sont toujours utilisés
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Répertoire pour les fichiers audio
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
const CACHE_DIR = path.join(UPLOADS_DIR, 'asmaa_cache');

// S'assurer que les répertoires existent
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Génère un nom de fichier unique basé sur le texte et un timestamp
 * @param {string} text - Texte à convertir en audio
 * @returns {string} - Nom de fichier unique
 */
function generateUniqueFilename(text, prefix = 'asmaa_female_') {
    // Créer un hash du texte + timestamp pour garantir l'unicité
    const timestamp = Date.now().toString();
    const hash = crypto.createHash('md5').update(text + timestamp).digest('hex');
    return `${prefix}${hash}.mp3`;
}

/**
 * Nettoie les anciens fichiers audio pour éviter de remplir le disque
 * Ne conserve que les 50 fichiers les plus récents
 */
function cleanupOldAudioFiles() {
    try {
        // Lire tous les fichiers dans le répertoire uploads
        const files = fs.readdirSync(UPLOADS_DIR)
            .filter(file => file.endsWith('.mp3'))
            .map(file => {
                const filePath = path.join(UPLOADS_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: filePath,
                    mtime: stats.mtime.getTime()
                };
            })
            // Trier par date de modification (du plus récent au plus ancien)
            .sort((a, b) => b.mtime - a.mtime);
        
        // Garder les 50 fichiers les plus récents, supprimer le reste
        if (files.length > 50) {
            console.log(`🧹 Nettoyage des fichiers audio: ${files.length - 50} fichiers à supprimer`);
            
            for (let i = 50; i < files.length; i++) {
                fs.unlinkSync(files[i].path);
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage des fichiers audio:', error.message);
    }
}

/**
 * Force l'utilisation de nouveaux fichiers audio pour éviter les problèmes de cache
 * Crée un fichier de manifeste avec des instructions anti-cache
 */
function generateAntiCacheManifest() {
    try {
        const manifest = {
            generated: Date.now(),
            audioFiles: [],
            cacheVersion: Date.now().toString(),
            forceReload: true
        };
        
        // Lister tous les fichiers audio disponibles
        const files = fs.readdirSync(UPLOADS_DIR)
            .filter(file => file.endsWith('.mp3'))
            .map(file => {
                const filePath = path.join(UPLOADS_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    url: `/uploads/${file}?v=${Date.now()}`,
                    created: stats.mtime.getTime()
                };
            });
        
        manifest.audioFiles = files;
        
        // Écrire le manifeste dans un fichier JSON
        fs.writeFileSync(
            path.join(UPLOADS_DIR, 'audio-manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        console.log(`✅ Manifeste anti-cache généré: ${files.length} fichiers audio`);
    } catch (error) {
        console.error('❌ Erreur lors de la génération du manifeste anti-cache:', error.message);
    }
}

/**
 * Vérifie si un fichier a été créé récemment
 * @param {string} filePath - Chemin du fichier à vérifier
 * @param {number} maxAgeMs - Âge maximum en millisecondes
 * @returns {boolean} - True si le fichier est récent, false sinon
 */
function isFileRecent(filePath, maxAgeMs = 60000) {
    try {
        const stats = fs.statSync(filePath);
        const fileAge = Date.now() - stats.mtime.getTime();
        return fileAge < maxAgeMs;
    } catch (error) {
        return false;
    }
}

/**
 * Copie un fichier audio existant pour en créer une nouvelle version
 * Utile pour forcer le rechargement des fichiers audio dans le frontend
 * @param {string} filePath - Chemin du fichier à copier
 * @returns {string} - Chemin du nouveau fichier
 */
function regenerateAudioFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        
        // Créer un nouveau nom de fichier avec un timestamp
        const fileName = path.basename(filePath);
        const newFileName = `asmaa_female_${Date.now()}_${fileName}`;
        const newFilePath = path.join(UPLOADS_DIR, newFileName);
        
        // Copier le fichier
        fs.copyFileSync(filePath, newFilePath);
        
        return `/uploads/${newFileName}?nocache=${Date.now()}`;
    } catch (error) {
        console.error('❌ Erreur lors de la régénération du fichier audio:', error.message);
        return null;
    }
}

// Exécuter le nettoyage au démarrage seulement si nécessaire
// Éviter de générer des fichiers à chaque redémarrage pour éviter les boucles nodemon
const shouldRunCleanup = process.env.NODE_ENV !== 'development' || !process.env.NODEMON_RUNNING;

if (shouldRunCleanup) {
    console.log('🧹 Exécution du nettoyage audio au démarrage...');
    cleanupOldAudioFiles();
    generateAntiCacheManifest();
} else {
    console.log('⏭️ Nettoyage audio ignoré en mode développement pour éviter les redémarrages nodemon');
}

// Exporter les fonctions utiles
module.exports = {
    generateUniqueFilename,
    cleanupOldAudioFiles,
    generateAntiCacheManifest,
    isFileRecent,
    regenerateAudioFile
};
