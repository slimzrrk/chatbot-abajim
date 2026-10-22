/**
 * Service TTS hybride qui combine Google Cloud TTS et TTS local
 * Utilise Google TTS en priorité pour l'arabe, avec fallback vers TTS local amélioré
 */
const fs = require('fs');
const path = require('path');

/**
 * Génère un fichier audio avec la meilleure méthode disponible
 * @param {string} text - Texte à convertir en audio
 * @returns {Promise<string>} - URL du fichier audio généré
 */
async function generateBestAudio(text) {
    if (!text || text.trim() === "") {
        console.error("❌ Texte vide, impossible de générer l'audio");
        return null;
    }
    
    console.log("🎯 Génération audio hybride pour:", text.substring(0, 50) + "...");
    
    // Méthode 1: Essayer Google Cloud TTS (meilleure qualité pour l'arabe)
    try {
        const googleTtsService = require('./googleTtsService');
        
        if (googleTtsService.isGoogleTtsConfigured()) {
            console.log("🌐 Utilisation de Google Cloud TTS...");
            const googleResult = await googleTtsService.generateGoogleTtsAudio(text);
            if (googleResult) {
                console.log("✅ Audio généré avec Google TTS");
                return googleResult;
            }
        } else {
            console.log("⚠️ Google Cloud TTS non configuré");
        }
    } catch (error) {
        console.error("❌ Erreur Google TTS:", error.message);
    }
    
    // Méthode 2: Essayer Azure Cognitive Services TTS (alternative)
    try {
        const azureResult = await generateAzureTts(text);
        if (azureResult) {
            console.log("✅ Audio généré avec Azure TTS");
            return azureResult;
        }
    } catch (error) {
        console.error("❌ Erreur Azure TTS:", error.message);
    }
    
    // Méthode 3: Utiliser le TTS local amélioré
    try {
        console.log("🔄 Fallback vers TTS local amélioré...");
        const localTtsService = require('./localTtsService');
        const localResult = await localTtsService.generateLocalAudio(text);
        if (localResult) {
            console.log("✅ Audio généré avec TTS local");
            return localResult;
        }
    } catch (error) {
        console.error("❌ Erreur TTS local:", error.message);
    }
    
    // Méthode 4: Utiliser un service TTS en ligne gratuit
    try {
        const onlineResult = await generateOnlineTts(text);
        if (onlineResult) {
            console.log("✅ Audio généré avec TTS en ligne");
            return onlineResult;
        }
    } catch (error) {
        console.error("❌ Erreur TTS en ligne:", error.message);
    }
    
    console.error("❌ Toutes les méthodes TTS ont échoué");
    return null;
}

/**
 * Génère un fichier audio avec Azure Cognitive Services
 * @param {string} text - Texte à convertir
 * @returns {Promise<string|null>} - URL du fichier audio ou null
 */
async function generateAzureTts(text) {
    // Vérifier si Azure est configuré
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
        console.log("⚠️ Azure Speech Services non configuré");
        return null;
    }
    
    try {
        const sdk = require('microsoft-cognitiveservices-speech-sdk');
        const crypto = require('crypto');
        
        const hash = crypto.createHash('md5').update(text.trim()).digest('hex');
        const filename = `asmaa_azure_${hash}.mp3`;
        const outputPath = path.join(__dirname, '../../../uploads/asmaa_cache', filename);
        
        // Vérifier si le fichier existe déjà
        if (fs.existsSync(outputPath)) {
            const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
            return `${baseUrl}/uploads/asmaa_cache/${filename}?nocache=${Date.now()}&gender=female&v=${Date.now()}`;
        }
        
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            process.env.AZURE_SPEECH_KEY,
            process.env.AZURE_SPEECH_REGION
        );
        
        // Configurer pour l'arabe
        speechConfig.speechSynthesisLanguage = "ar-SA"; // Arabe saoudien
        speechConfig.speechSynthesisVoiceName = "ar-SA-ZariyahNeural"; // Voix féminine arabe
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
        
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputPath);
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        
        return new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(
                text,
                result => {
                    synthesizer.close();
                    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                        const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
                        const fullUrl = `${baseUrl}/uploads/asmaa_cache/${filename}?nocache=${Date.now()}&gender=female&v=${Date.now()}`;
                        resolve(fullUrl);
                    } else {
                        reject(new Error(`Azure TTS failed: ${result.errorDetails}`));
                    }
                },
                error => {
                    synthesizer.close();
                    reject(error);
                }
            );
        });
        
    } catch (error) {
        console.error("❌ Erreur Azure TTS:", error.message);
        return null;
    }
}

/**
 * Génère un fichier audio avec un service TTS en ligne gratuit
 * @param {string} text - Texte à convertir
 * @returns {Promise<string|null>} - URL du fichier audio ou null
 */
async function generateOnlineTts(text) {
    try {
        const axios = require('axios');
        const crypto = require('crypto');
        
        const hash = crypto.createHash('md5').update(text.trim()).digest('hex');
        const filename = `asmaa_online_${hash}.mp3`;
        const outputPath = path.join(__dirname, '../../../uploads/asmaa_cache', filename);
        
        // Vérifier si le fichier existe déjà
        if (fs.existsSync(outputPath)) {
            const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
            return `${baseUrl}/uploads/asmaa_cache/${filename}?nocache=${Date.now()}&gender=female&v=${Date.now()}`;
        }
        
        // Utiliser un service TTS gratuit (exemple: ResponsiveVoice ou similaire)
        // Note: Remplacez par un vrai service TTS gratuit qui supporte l'arabe
        console.log("🌐 Tentative avec service TTS en ligne...");
        
        // Exemple d'appel à un service TTS gratuit
        // const response = await axios.post('https://api.voicerss.org/', {
        //     key: 'YOUR_API_KEY',
        //     src: text,
        //     hl: 'ar-sa',
        //     f: '22khz_16bit_mono',
        //     c: 'mp3'
        // }, { responseType: 'arraybuffer' });
        
        // Pour l'instant, retourner null car nous n'avons pas de service configuré
        console.log("⚠️ Service TTS en ligne non configuré");
        return null;
        
    } catch (error) {
        console.error("❌ Erreur TTS en ligne:", error.message);
        return null;
    }
}

/**
 * Vérifie quels services TTS sont disponibles
 * @returns {Object} - État des services TTS
 */
function checkTtsAvailability() {
    const status = {
        google: false,
        azure: false,
        local: true, // Toujours disponible
        online: false
    };
    
    try {
        const googleTtsService = require('./googleTtsService');
        status.google = googleTtsService.isGoogleTtsConfigured();
    } catch (error) {
        status.google = false;
    }
    
    status.azure = !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
    
    return status;
}

/**
 * Obtient des informations sur les voix arabes disponibles
 * @returns {Object} - Informations sur les voix
 */
function getArabicVoicesInfo() {
    const info = {
        google: [],
        azure: [],
        local: ['Majed', 'Tarik', 'Maged', 'Samantha (fallback)']
    };
    
    try {
        const googleTtsService = require('./googleTtsService');
        info.google = googleTtsService.getAvailableArabicVoices();
    } catch (error) {
        info.google = [];
    }
    
    if (process.env.AZURE_SPEECH_KEY) {
        info.azure = [
            { name: 'ar-SA-ZariyahNeural', gender: 'FEMALE', language: 'ar-SA' },
            { name: 'ar-SA-HamedNeural', gender: 'MALE', language: 'ar-SA' },
            { name: 'ar-EG-SalmaNeural', gender: 'FEMALE', language: 'ar-EG' },
            { name: 'ar-EG-ShakirNeural', gender: 'MALE', language: 'ar-EG' }
        ];
    }
    
    return info;
}

module.exports = {
    generateBestAudio,
    checkTtsAvailability,
    getArabicVoicesInfo
};
