/**
 * Service TTS de secours local
 * Génère des fichiers audio en temps réel avec le TTS système
 * et utilise un cache local pour éviter les problèmes d'API
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

// Répertoire pour les fichiers audio
const AUDIO_DIR = path.join(__dirname, '../../../uploads/asmaa_cache');

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Messages pré-définis pour la voix féminine
const PREDEFINED_MESSAGES = {
    'greetings': {
        text: 'مرحبا! أنا عسماء، مساعدتك الذكية. كيف يمكنني مساعدتك اليوم؟',
        filename: 'asmaa_greeting.mp3'
    },
    'not_found': {
        text: 'آسف، لم أجد ما تبحث عنه. هل يمكنك إعادة صياغة طلبك؟',
        filename: 'asmaa_not_found.mp3'
    },
    'course_not_found': {
        text: 'آسف، لم أجد الدرس المطلوب. يمكنني مساعدتك في البحث عن دروس أخرى.',
        filename: 'asmaa_course_not_found.mp3'
    },
    'thanks': {
        text: 'شكرا لك! هل هناك شيء آخر يمكنني مساعدتك به؟',
        filename: 'asmaa_thanks.mp3' 
    },
    'fallback': {
        text: 'أنا هنا لمساعدتك. يمكنك سؤالي عن الدروس، أو المواد، أو أي شيء آخر تحتاجه.',
        filename: 'asmaa_fallback.mp3'
    }
};

// Copier les fichiers prédéfinis s'ils existent dans le dossier du projet
function initializePredefinedFiles() {
    const predefinedDir = path.join(__dirname, '../../../assets/audio');
    
    if (fs.existsSync(predefinedDir)) {
        Object.values(PREDEFINED_MESSAGES).forEach(message => {
            const sourcePath = path.join(predefinedDir, message.filename);
            const destPath = path.join(AUDIO_DIR, message.filename);
            
            if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
                try {
                    fs.copyFileSync(sourcePath, destPath);
                    console.log(`✅ Fichier audio prédéfini copié: ${message.filename}`);
                } catch (error) {
                    console.error(`❌ Erreur lors de la copie du fichier ${message.filename}:`, error.message);
                }
            }
        });
    }
}

/**
 * Trouve le message prédéfini le plus proche
 * @param {string} text - Texte à convertir en audio
 * @returns {string|null} - Chemin du fichier audio prédéfini ou null
 */
function findClosestPredefinedMessage(text) {
    if (!text) return null;
    
    // Vérifier si le texte correspond exactement à un message prédéfini
    for (const [key, message] of Object.entries(PREDEFINED_MESSAGES)) {
        if (text.includes(message.text)) {
            console.log(`✅ Message prédéfini trouvé: ${key}`);
            return `/uploads/asmaa_cache/${message.filename}?nocache=${Date.now()}`;
        }
    }
    
    // Chercher le message le plus similaire
    let bestMatch = null;
    let highestSimilarity = 0;
    
    for (const [key, message] of Object.entries(PREDEFINED_MESSAGES)) {
        // Calculer la similarité entre le texte et le message prédéfini
        const similarity = calculateSimilarity(text, message.text);
        if (similarity > highestSimilarity && similarity > 0.7) {
            highestSimilarity = similarity;
            bestMatch = key;
        }
    }
    
    if (bestMatch) {
        console.log(`✅ Message similaire trouvé: ${bestMatch} (similarité: ${highestSimilarity.toFixed(2)})`);
        return `/uploads/asmaa_cache/${PREDEFINED_MESSAGES[bestMatch].filename}?nocache=${Date.now()}`;
    }
    
    return null;
}

/**
 * Calcule la similarité entre deux textes (méthode simple)
 * @param {string} text1 - Premier texte
 * @param {string} text2 - Deuxième texte
 * @returns {number} - Score de similarité entre 0 et 1
 */
function calculateSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    // Compter les mots communs
    let commonWords = 0;
    for (const word of words1) {
        if (word.length > 2 && words2.includes(word)) {
            commonWords++;
        }
    }
    
    // Calculer la similarité
    return commonWords / Math.max(words1.length, words2.length);
}

/**
 * Génère un nom de fichier unique basé sur le contenu du texte
 * @param {string} text - Texte à convertir en nom de fichier
 * @returns {string} - Nom de fichier unique
 */
function generateUniqueFilename(text) {
    // Créer un hash du texte pour générer un nom de fichier unique
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return `asmaa_female_${hash}.mp3`;
}

/**
 * Vérifie si un fichier audio existe déjà pour ce texte
 * @param {string} text - Texte à vérifier
 * @returns {string|null} - Chemin du fichier audio s'il existe, sinon null
 */
function getExistingAudioFile(text) {
    const filename = generateUniqueFilename(text);
    const filePath = path.join(AUDIO_DIR, filename);

    if (fs.existsSync(filePath)) {
        console.log(`✅ Fichier audio existant trouvé: ${filename}`);
        const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
        return `${baseUrl}/uploads/asmaa_cache/${filename}?nocache=${Date.now()}&gender=female&v=${Date.now()}`;
    }

    return null;
}

/**
 * Génère un fichier audio avec le TTS système
 * @param {string} text - Texte à convertir en audio
 * @returns {Promise<string|null>} - Chemin du fichier audio généré ou null
 */
function generateTtsAudio(text) {
    return new Promise((resolve, reject) => {
        const filename = generateUniqueFilename(text);
        const tempPath = path.join(AUDIO_DIR, `temp_${filename.replace('.mp3', '.aiff')}`);
        const outputPath = path.join(AUDIO_DIR, filename);

        console.log(`🎵 Génération audio TTS pour: ${text.substring(0, 50)}...`);

        // Nettoyer le texte pour le TTS (enlever les emojis et caractères spéciaux)
        let cleanText = text
            // Enlever tous les emojis
            .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
            // Enlever les caractères spéciaux mais garder l'arabe, les espaces et la ponctuation de base
            .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\w\.,!?]/g, '')
            // Enlever les points d'exclamation multiples
            .replace(/!+/g, '.')
            // Enlever les points multiples
            .replace(/\.+/g, '.')
            // Nettoyer les espaces multiples
            .replace(/\s+/g, ' ')
            .trim();

        // Si le texte nettoyé est vide ou trop court, utiliser un texte de fallback en arabe
        if (!cleanText || cleanText.length < 5) {
            cleanText = 'مرحبا، أنا أسماء مساعدتك الذكية';
        }

        console.log(`🧹 Texte nettoyé: "${cleanText}"`);
        console.log(`📏 Longueur: ${cleanText.length} caractères`);

        // Utiliser une voix système appropriée pour l'arabe
        // Essayer différentes voix qui peuvent mieux supporter l'arabe
        const arabicVoices = [
            'Majed',     // Voix arabe si disponible
            'Tarik',     // Voix arabe si disponible
            'Maged',     // Voix arabe si disponible
            'Samantha',  // Fallback anglais
            'Alex',      // Fallback anglais
            'Victoria'   // Fallback anglais
        ];

        let selectedVoice = 'Samantha'; // Voix par défaut

        // Essayer de trouver une voix arabe disponible
        for (const voice of arabicVoices) {
            try {
                // Tester si la voix est disponible
                const testCommand = `say -v "${voice}" ""`;
                require('child_process').execSync(testCommand, { stdio: 'ignore' });
                selectedVoice = voice;
                console.log(`✅ Voix trouvée: ${voice}`);
                break;
            } catch (error) {
                console.log(`⚠️ Voix non disponible: ${voice}`);
                continue;
            }
        }

        const sayCommand = `say -v "${selectedVoice}" -r 160 -o "${tempPath}" "${cleanText}"`;

        console.log(`🗣️ Commande TTS: say -v "${selectedVoice}" -r 160 -o "${tempPath}" "${cleanText.substring(0, 30)}..."`);
        console.log(`🎤 Voix sélectionnée: ${selectedVoice}`);

        exec(sayCommand, (error1, stdout1, stderr1) => {
            if (error1) {
                console.error('❌ Erreur TTS say:', error1.message);
                reject(error1);
                return;
            }

            // Convertir en MP3
            const convertCommand = `ffmpeg -i "${tempPath}" -ac 1 -ar 22050 -b:a 64k -y "${outputPath}"`;

            exec(convertCommand, (error2, stdout2, stderr2) => {
                // Nettoyer le fichier temporaire
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }

                if (error2) {
                    console.error('❌ Erreur conversion MP3:', error2.message);
                    reject(error2);
                } else {
                    console.log(`✅ Fichier audio généré: ${filename}`);
                    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
                    const fullUrl = `${baseUrl}/uploads/asmaa_cache/${filename}?nocache=${Date.now()}&gender=female&v=${Date.now()}`;
                    resolve(fullUrl);
                }
            });
        });
    });
}

/**
 * Génère un fichier audio à partir d'un texte en utilisant le cache local
 * @param {string} text - Texte à convertir en audio
 * @returns {Promise<string|null>} - Chemin relatif du fichier audio généré ou null
 */
async function generateLocalAudio(text) {
    if (!text || text.trim() === "") {
        console.error("❌ Texte vide, impossible de générer l'audio");
        return null;
    }
    
    console.log("🔍 Recherche d'un fichier audio local pour:", text.substring(0, 50) + "...");
    
    // Initialiser les fichiers prédéfinis
    initializePredefinedFiles();
    
    // Vérifier si un message prédéfini correspond
    const predefinedPath = findClosestPredefinedMessage(text);
    if (predefinedPath) {
        return predefinedPath;
    }
    
    // Vérifier si un fichier audio existe déjà pour ce texte
    const existingPath = getExistingAudioFile(text);
    if (existingPath) {
        return existingPath;
    }

    // Générer un nouveau fichier audio avec le texte
    console.log("🎵 Génération d'un nouveau fichier audio avec le texte de la réponse...");
    try {
        const generatedPath = await generateTtsAudio(text);
        if (generatedPath) {
            console.log(`🔊 Chemin audio généré pour frontend: ${generatedPath}`);
            return generatedPath;
        }
    } catch (error) {
        console.error("❌ Erreur lors de la génération TTS:", error.message);
    }

    // Si la génération échoue, utiliser le fichier de fallback
    console.log("⚠️ Génération TTS échouée, utilisation du fallback");
    const timestamp = Date.now();

    // Vérification supplémentaire pour asmaa_fallback.mp3
    const fallbackPath = path.join(AUDIO_DIR, PREDEFINED_MESSAGES.fallback.filename);

    // Si le fichier de fallback n'existe pas, créer un fichier vide pour éviter des erreurs
    if (!fs.existsSync(fallbackPath)) {
        console.error("❌ ALERTE: Le fichier de fallback asmaa_fallback.mp3 est manquant!");
        console.error("   Vérifiez que le fichier existe dans /assets/audio ou créez-le manuellement.");

        // Essayer de copier depuis le répertoire assets si possible
        const assetsPath = path.join(__dirname, '../../../assets/audio/asmaa_fallback.mp3');
        if (fs.existsSync(assetsPath)) {
            try {
                fs.copyFileSync(assetsPath, fallbackPath);
                console.log("✅ Fichier de fallback copié avec succès depuis assets");
            } catch (copyError) {
                console.error("❌ Erreur lors de la copie du fichier de fallback:", copyError.message);
            }
        }
    }

    // Générer un chemin avec paramètres clairs pour la voix féminine
    // Utiliser l'URL complète pour le frontend mobile
    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
    const fullPath = `${baseUrl}/uploads/asmaa_cache/${PREDEFINED_MESSAGES.fallback.filename}?nocache=${timestamp}&gender=female&v=${timestamp}`;
    console.log(`🔊 Chemin audio complet pour frontend: ${fullPath}`);

    return fullPath;
}

module.exports = {
    generateLocalAudio
};
