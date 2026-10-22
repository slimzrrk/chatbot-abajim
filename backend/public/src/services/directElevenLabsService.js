/**
 * Service dédié pour l'intégration directe avec l'API ElevenLabs
 * Spécialement conçu pour garantir l'utilisation de la voix féminine Asmaa
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');
const audioCacheManager = require('../utils/audioCacheManager');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, "../../../.env") });

// Répertoire pour les fichiers audio
const AUDIO_DIR = path.join(__dirname, '../../../uploads/asmaa_cache');

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// ID de la voix Asmaa - Voix féminine arabe (NE PAS MODIFIER)
const ASMAA_VOICE_ID = 'qi4PkV9c01kb869Vh7Su';

// Logs spécifiques pour aider à déboguer les problèmes de voix
console.log(`🔊 VOIX ASMAA - ID configuré: ${ASMAA_VOICE_ID}`);
console.log(`💾 DOSSIER CACHE AUDIO: ${AUDIO_DIR}`);

// Récupérer et nettoyer la clé API
let ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (ELEVENLABS_API_KEY) {
    // Nettoyer la clé API en gardant les underscores qui sont valides
    ELEVENLABS_API_KEY = ELEVENLABS_API_KEY.trim().replace(/[^a-zA-Z0-9_]/g, '');
    console.log(`🔑 Clé API nettoyée: ${ELEVENLABS_API_KEY.substring(0, 5)}...${ELEVENLABS_API_KEY.substring(ELEVENLABS_API_KEY.length - 5)}`);
}

// ASMAA_VOICE_ID est déjà défini plus haut, ne pas utiliser FEMALE_VOICE_ID pour éviter les confusions

/**
 * Vérifie la validité de la clé API ElevenLabs
 * @returns {Promise<boolean>} true si la clé est valide, false sinon
 */
async function verifyApiKey() {
    try {
        console.log("🔑 Vérification de la clé API ElevenLabs...");
        // Vérifier que la clé API est bien nettoyée
        const cleanedKey = ELEVENLABS_API_KEY.trim().replace(/[^a-zA-Z0-9_]/g, '');
        console.log(`🔑 Vérification avec clé API: ${cleanedKey.substring(0, 5)}...${cleanedKey.substring(cleanedKey.length - 5)}`);
        
        const response = await axios.get("https://api.elevenlabs.io/v1/user", {
            headers: {
                "xi-api-key": cleanedKey
            }
        });
        
        console.log("✅ Clé API ElevenLabs valide. Utilisateur:", response.data.subscription?.tier || "Free");
        return true;
    } catch (error) {
        console.error("❌ Erreur de vérification de la clé API ElevenLabs:", 
            error.response?.status, 
            error.response?.data?.detail || error.message);
        return false;
    }
}

/**
 * Génère un fichier audio à partir d'un texte en utilisant la voix féminine Asmaa
 * @param {string} text - Texte à convertir en audio
 * @returns {Promise<string|null>} - Chemin relatif du fichier audio généré ou null en cas d'erreur
 */
async function generateFemaleVoice(text) {
    if (!text || text.trim() === "") {
        console.error("❌ Texte vide, impossible de générer l'audio");
        return null;
    }

    try {
        // Vérifier que la clé API est valide
        const isApiKeyValid = await verifyApiKey();
        if (!isApiKeyValid) {
            throw new Error("Clé API ElevenLabs invalide");
        }
        
        console.log("🔍 Génération de voix féminine avec l'API directe ElevenLabs...");
        console.log(`🎤 Utilisation de la voix féminine Asmaa (ID: ${ASMAA_VOICE_ID})`);
        
        // Afficher la clé API masquée pour le débogage
        console.log(`🔑 Clé API utilisée pour TTS: ${ELEVENLABS_API_KEY.substring(0, 5)}...${ELEVENLABS_API_KEY.substring(ELEVENLABS_API_KEY.length - 5)}`);
        
        // Essayer avec un modèle plus ancien pour la compatibilité
        const modelId = "eleven_multilingual_v1";
        console.log(`💻 Utilisation du modèle: ${modelId}`);
        
        // Appel direct à l'API ElevenLabs avec des paramètres simplifiés
        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${ASMAA_VOICE_ID}`,
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg'
            },
            data: {
                text: text,
                model_id: modelId,
                voice_settings: {
                    stability: 0.8,
                    similarity_boost: 0.5,
                    style: 0.0,
                    use_speaker_boost: true
                }
            },
            responseType: 'arraybuffer',
            timeout: 30000 // Réduire le timeout pour éviter les attentes trop longues
        });
        
        // Vérifier que la réponse est valide
        if (response.status !== 200) {
            throw new Error(`Erreur API ElevenLabs: ${response.status}`);
        }
        
        // Convertir la réponse en buffer
        const audioBuffer = Buffer.from(response.data);
        
        // Create uploads directory if needed
        const uploadDir = path.join(__dirname, "../../../uploads/");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename with female voice prefix to prevent caching
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const uniqueName = `asmaa_female_${timestamp}_${random}.mp3`;
        const filePath = path.join(uploadDir, uniqueName);
        
        console.log(`💾 Enregistrement du fichier audio: ${filePath}`);

        // Save file to the uploads directory
        fs.writeFileSync(filePath, audioBuffer);

        console.log("✅ Fichier audio féminin généré:", filePath);

        // Add cache-busting query parameter to prevent browser caching
        return `/uploads/${uniqueName}?nocache=${timestamp}`;
        
    } catch (error) {
        console.error("❌ Erreur lors de la génération de la voix féminine:", 
            error.response?.status || error.message,
            error.response?.data?.detail || "");
            
        // Tentative d'urgence avec une approche simplifiée
        try {
            console.log("🚨 Tentative d'urgence avec méthode alternative...");
            
            // Nettoyer à nouveau la clé API
            const emergencyKey = process.env.ELEVENLABS_API_KEY.trim().replace(/[^a-zA-Z0-9_]/g, '');
            
            // Appel d'urgence avec paramètres minimaux
            const emergencyResponse = await axios({
                method: 'post',
                url: `https://api.elevenlabs.io/v1/text-to-speech/${ASMAA_VOICE_ID}/stream`,
                headers: {
                    'xi-api-key': emergencyKey,
                    'Content-Type': 'application/json'
                },
                data: {
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    output_format: "mp3_44100_128"
                },
                responseType: 'arraybuffer'
            });
            
            // Si on arrive ici, c'est que ça a fonctionné
            const emergencyBuffer = Buffer.from(emergencyResponse.data);
            const emergencyDir = path.join(__dirname, "../../../uploads/");
            if (!fs.existsSync(emergencyDir)) {
                fs.mkdirSync(emergencyDir, { recursive: true });
            }
            
            // Générer un nom de fichier d'urgence
            const emergencyTimestamp = Date.now();
            const emergencyName = `asmaa_emergency_${emergencyTimestamp}.mp3`;
            const emergencyPath = path.join(emergencyDir, emergencyName);
            
            // Sauvegarder le fichier
            fs.writeFileSync(emergencyPath, emergencyBuffer);
            console.log("✅ Fichier audio d'urgence généré:", emergencyPath);
            
            return `/uploads/${emergencyName}?nocache=${emergencyTimestamp}`;
            
        } catch (emergencyError) {
            console.error("❌ Erreur lors de la tentative d'urgence:", 
                emergencyError.response?.status || emergencyError.message);
            return null;
        }
    }
}

// Exporter les fonctions
module.exports = {
    generateFemaleVoice,
    verifyApiKey
};
