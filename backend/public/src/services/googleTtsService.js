/**
 * Service TTS Google Cloud pour la génération d'audio en arabe
 * Utilise l'API Google Cloud Text-to-Speech pour une meilleure qualité vocale en arabe
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration Google Cloud TTS
const GOOGLE_TTS_CONFIG = {
    // Voix arabes disponibles dans Google Cloud TTS
    voices: {
        'ar-XA-Standard-A': { gender: 'FEMALE', language: 'ar-XA' }, // Arabe moderne standard - Femme
        'ar-XA-Standard-B': { gender: 'MALE', language: 'ar-XA' },   // Arabe moderne standard - Homme
        'ar-XA-Standard-C': { gender: 'MALE', language: 'ar-XA' },   // Arabe moderne standard - Homme
        'ar-XA-Standard-D': { gender: 'FEMALE', language: 'ar-XA' }, // Arabe moderne standard - Femme
        'ar-XA-Wavenet-A': { gender: 'FEMALE', language: 'ar-XA' },  // Voix Wavenet (meilleure qualité) - Femme
        'ar-XA-Wavenet-B': { gender: 'MALE', language: 'ar-XA' },    // Voix Wavenet (meilleure qualité) - Homme
        'ar-XA-Wavenet-C': { gender: 'MALE', language: 'ar-XA' },    // Voix Wavenet (meilleure qualité) - Homme
    },
    defaultVoice: 'ar-XA-Wavenet-A', // Voix féminine Wavenet par défaut
    audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0,
        sampleRateHertz: 22050
    }
};

const AUDIO_DIR = path.join(__dirname, '../../../uploads/asmaa_cache');

/**
 * Génère un nom de fichier unique basé sur le texte
 * @param {string} text - Texte à hasher
 * @returns {string} - Nom de fichier unique
 */
function generateUniqueFilename(text) {
    const hash = crypto.createHash('md5').update(text.trim()).digest('hex');
    return `asmaa_google_${hash}.mp3`;
}

/**
 * Nettoie le texte pour le TTS Google
 * @param {string} text - Texte à nettoyer
 * @returns {string} - Texte nettoyé
 */
function cleanTextForGoogleTts(text) {
    let cleanText = text
        // Enlever tous les emojis
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        // Garder seulement l'arabe, les espaces et la ponctuation de base
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\.,!?]/g, '')
        // Normaliser la ponctuation
        .replace(/!+/g, '.')
        .replace(/\.+/g, '.')
        .replace(/\?+/g, '?')
        // Nettoyer les espaces multiples
        .replace(/\s+/g, ' ')
        .trim();
    
    // Si le texte nettoyé est vide ou trop court, utiliser un texte de fallback en arabe
    if (!cleanText || cleanText.length < 5) {
        cleanText = 'مرحبا، أنا أسماء مساعدتك الذكية';
    }
    
    return cleanText;
}

/**
 * Génère un fichier audio avec Google Cloud TTS
 * @param {string} text - Texte à convertir en audio
 * @param {string} voiceName - Nom de la voix à utiliser
 * @returns {Promise<string>} - URL du fichier audio généré
 */
async function generateGoogleTtsAudio(text, voiceName = GOOGLE_TTS_CONFIG.defaultVoice) {
    return new Promise(async (resolve, reject) => {
        try {
            const filename = generateUniqueFilename(text);
            const outputPath = path.join(AUDIO_DIR, filename);
            
            // Vérifier si le fichier existe déjà
            if (fs.existsSync(outputPath)) {
                console.log(`✅ Fichier Google TTS existant trouvé: ${filename}`);
                const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
                const fullUrl = `${baseUrl}/uploads/asmaa_cache/${filename}?nocache=${Date.now()}&gender=female&v=${Date.now()}`;
                resolve(fullUrl);
                return;
            }
            
            const cleanText = cleanTextForGoogleTts(text);
            console.log(`🎵 Génération Google TTS pour: ${cleanText.substring(0, 50)}...`);
            console.log(`🗣️ Voix utilisée: ${voiceName}`);
            
            // Importer Google Cloud TTS
            const textToSpeech = require('@google-cloud/text-to-speech');
            const client = new textToSpeech.TextToSpeechClient();
            
            const voiceConfig = GOOGLE_TTS_CONFIG.voices[voiceName];
            if (!voiceConfig) {
                throw new Error(`Voix non supportée: ${voiceName}`);
            }
            
            // Configuration de la requête
            const request = {
                input: { text: cleanText },
                voice: {
                    languageCode: voiceConfig.language,
                    name: voiceName,
                    ssmlGender: voiceConfig.gender,
                },
                audioConfig: GOOGLE_TTS_CONFIG.audioConfig,
            };
            
            // Générer l'audio
            console.log(`🔄 Appel API Google Cloud TTS...`);
            const [response] = await client.synthesizeSpeech(request);
            
            // Sauvegarder le fichier audio
            fs.writeFileSync(outputPath, response.audioContent, 'binary');
            console.log(`✅ Fichier Google TTS généré: ${filename}`);
            
            const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
            const fullUrl = `${baseUrl}/uploads/asmaa_cache/${filename}?nocache=${Date.now()}&gender=female&v=${Date.now()}`;
            resolve(fullUrl);
            
        } catch (error) {
            console.error('❌ Erreur Google TTS:', error.message);
            reject(error);
        }
    });
}

/**
 * Génère un fichier audio avec fallback vers le TTS local
 * @param {string} text - Texte à convertir en audio
 * @returns {Promise<string>} - URL du fichier audio généré
 */
async function generateAudioWithFallback(text) {
    try {
        // Essayer d'abord Google TTS
        console.log('🌐 Tentative avec Google Cloud TTS...');
        return await generateGoogleTtsAudio(text);
    } catch (error) {
        console.error('⚠️ Google TTS échoué, fallback vers TTS local:', error.message);
        
        // Fallback vers le service TTS local
        const localTtsService = require('./localTtsService');
        return await localTtsService.generateLocalAudio(text);
    }
}

/**
 * Vérifie si Google Cloud TTS est configuré
 * @returns {boolean} - True si configuré
 */
function isGoogleTtsConfigured() {
    try {
        // Vérifier si les credentials Google Cloud sont disponibles
        const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (credentials && fs.existsSync(credentials)) {
            return true;
        }
        
        // Vérifier si la clé API est définie
        if (process.env.GOOGLE_CLOUD_API_KEY) {
            return true;
        }
        
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Liste les voix arabes disponibles
 * @returns {Array} - Liste des voix arabes
 */
function getAvailableArabicVoices() {
    return Object.keys(GOOGLE_TTS_CONFIG.voices).map(voiceName => ({
        name: voiceName,
        gender: GOOGLE_TTS_CONFIG.voices[voiceName].gender,
        language: GOOGLE_TTS_CONFIG.voices[voiceName].language,
        type: voiceName.includes('Wavenet') ? 'Wavenet (Premium)' : 'Standard'
    }));
}

module.exports = {
    generateGoogleTtsAudio,
    generateAudioWithFallback,
    isGoogleTtsConfigured,
    getAvailableArabicVoices,
    cleanTextForGoogleTts
};
