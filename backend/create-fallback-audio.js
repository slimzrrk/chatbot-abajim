#!/usr/bin/env node

/**
 * Script pour créer un fichier audio fallback valide
 * Utilise différentes méthodes selon la plateforme
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const UPLOADS_DIR = path.join(__dirname, 'uploads/asmaa_cache');
const ASSETS_DIR = path.join(__dirname, 'assets/audio');
const FALLBACK_FILE = 'asmaa_fallback.mp3';

// Créer les dossiers s'ils n'existent pas
[UPLOADS_DIR, ASSETS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Dossier créé: ${dir}`);
    }
});

/**
 * Créer un fichier audio avec ffmpeg (ton simple)
 */
function createWithFFmpeg() {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(UPLOADS_DIR, FALLBACK_FILE);
        const command = `ffmpeg -f lavfi -i "sine=frequency=440:duration=2" -ac 1 -ar 22050 -b:a 64k "${outputPath}" -y`;
        
        console.log('🎵 Création du fichier audio avec ffmpeg...');
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                console.log('✅ Fichier audio créé avec ffmpeg');
                resolve(outputPath);
            }
        });
    });
}

/**
 * Créer un fichier audio avec say (macOS)
 */
function createWithSay() {
    return new Promise((resolve, reject) => {
        const tempPath = path.join(UPLOADS_DIR, 'temp_fallback.aiff');
        const outputPath = path.join(UPLOADS_DIR, FALLBACK_FILE);
        
        console.log('🎵 Création du fichier audio avec say...');
        
        // Étape 1: Créer un fichier AIFF avec say
        const sayCommand = `say -v "Samantha" -o "${tempPath}" "مرحبا، أنا أسماء مساعدتك الذكية"`;
        
        exec(sayCommand, (error1, stdout1, stderr1) => {
            if (error1) {
                reject(error1);
                return;
            }
            
            // Étape 2: Convertir AIFF en MP3 avec ffmpeg
            const convertCommand = `ffmpeg -i "${tempPath}" -ac 1 -ar 22050 -b:a 64k "${outputPath}" -y`;
            
            exec(convertCommand, (error2, stdout2, stderr2) => {
                // Nettoyer le fichier temporaire
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
                
                if (error2) {
                    reject(error2);
                } else {
                    console.log('✅ Fichier audio créé avec say + ffmpeg');
                    resolve(outputPath);
                }
            });
        });
    });
}

/**
 * Créer un fichier audio de secours minimal
 */
function createMinimalFallback() {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(UPLOADS_DIR, FALLBACK_FILE);
        
        // Créer un fichier MP3 minimal avec ffmpeg
        const command = `ffmpeg -f lavfi -i "sine=frequency=800:duration=1" -ac 1 -ar 22050 -b:a 32k "${outputPath}" -y`;
        
        console.log('🎵 Création du fichier audio minimal...');
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                console.log('✅ Fichier audio minimal créé');
                resolve(outputPath);
            }
        });
    });
}

/**
 * Copier le fichier vers le dossier assets
 */
function copyToAssets(sourcePath) {
    const destPath = path.join(ASSETS_DIR, FALLBACK_FILE);
    
    try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Fichier copié vers: ${destPath}`);
        return destPath;
    } catch (error) {
        console.error(`❌ Erreur lors de la copie: ${error.message}`);
        throw error;
    }
}

/**
 * Vérifier qu'un fichier audio est valide
 */
function verifyAudioFile(filePath) {
    return new Promise((resolve, reject) => {
        const command = `ffprobe -v quiet -print_format json -show_format "${filePath}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                try {
                    const info = JSON.parse(stdout);
                    const duration = parseFloat(info.format.duration);
                    const size = parseInt(info.format.size);
                    
                    console.log(`📊 Fichier audio valide: ${duration.toFixed(2)}s, ${size} bytes`);
                    resolve(true);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

/**
 * Fonction principale
 */
async function createFallbackAudio() {
    console.log('🎯 Création du fichier audio fallback...');
    
    try {
        let audioPath;
        
        // Essayer différentes méthodes dans l'ordre de préférence
        try {
            audioPath = await createWithSay();
        } catch (error) {
            console.warn('⚠️ Échec avec say, essai avec ffmpeg simple...');
            try {
                audioPath = await createWithFFmpeg();
            } catch (error2) {
                console.warn('⚠️ Échec avec ffmpeg, création d\'un fichier minimal...');
                audioPath = await createMinimalFallback();
            }
        }
        
        // Vérifier que le fichier est valide
        await verifyAudioFile(audioPath);
        
        // Copier vers assets
        copyToAssets(audioPath);
        
        console.log('🎉 Fichier audio fallback créé avec succès !');
        console.log(`📁 Emplacement: ${audioPath}`);
        
    } catch (error) {
        console.error('❌ Erreur lors de la création du fichier audio:', error.message);
        process.exit(1);
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    createFallbackAudio();
}

module.exports = { createFallbackAudio };
