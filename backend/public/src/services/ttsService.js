/**
 * Service TTS principal qui oriente vers la bonne source de génération vocale
 * Utilise en priorité directElevenLabsService pour la voix féminine Asmaa
 */
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

// Importer les services de génération vocale
const directElevenLabsService = require('./directElevenLabsService');
const localTtsService = require('./localTtsService');
const hybridTtsService = require('./hybridTtsService');
const quotaManager = require('./quotaManager');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, "../../../.env") });

// Récupérer la clé API depuis les variables d'environnement et la nettoyer
let ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Nettoyer la clé API (supprimer les espaces, retours à la ligne, etc.)
if (ELEVENLABS_API_KEY) {
    // Supprimer les caractères non valides mais garder les underscores
    // ELEVENLABS_API_KEY = ELEVENLABS_API_KEY.trim().replace(/[^a-zA-Z0-9_]/g, '');
    console.log(`🔑 Clé API nettoyée (ttsService): ${ELEVENLABS_API_KEY.substring(0, 5)}...${ELEVENLABS_API_KEY.substring(ELEVENLABS_API_KEY.length - 5)}`);
}

// Vérifier si la clé API est définie
if (!ELEVENLABS_API_KEY) {
    console.error("❌ ERREUR: La clé API ElevenLabs n'est pas définie dans les variables d'environnement!");
    console.error("   Veuillez définir ELEVENLABS_API_KEY dans le fichier .env");
}

// 📢 Female voice options for Arabic
// Option 1: "21m00Tcm4TlvDq8ikWAM" - Rachel (good multilingual support)
// Option 2: "EXAVITQu4vr4xnSDxMaL" - Bella (good for Arabic)
// Option 3: "jsCqWAovK2LkecY7zXl4" - Grace (warm female voice)
// Option 4: "qi4PkV9c01kb869Vh7Su" - Asmaa (official female Arabic voice)
const VOICE_ID = "qi4PkV9c01kb869Vh7Su"; // Asmaa - Official female Arabic voice

// La bibliothèque ElevenLabs n'est plus utilisée
// Nous utilisons directement directElevenLabsService.js

// Fonction pour vérifier la validité de la clé API
async function verifyApiKey() {
    try {
        // Vérifier que la clé API est bien nettoyée
        const cleanedKey = ELEVENLABS_API_KEY.trim().replace(/[^a-zA-Z0-9_]/g, '');
        console.log(`🔑 Vérification avec clé API (ttsService): ${cleanedKey.substring(0, 5)}...${cleanedKey.substring(cleanedKey.length - 5)}`);
        
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

// Vérifier la clé API au démarrage
verifyApiKey();

// 🔧 Optimized function to convert ReadableStream to Buffer
async function streamToBuffer(stream) {
    const reader = stream.getReader();
    const chunks = [];

    try {
        // Process stream in chunks
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);

            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 5));
        }

        return Buffer.concat(chunks);
    } catch (error) {
        console.error("❌ Error in streamToBuffer:", error);
        throw error;
    }
}

// Cache simple pour éviter la régénération du même texte
const audioCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fonction principale de génération vocale
async function textToSpeech(text) {
    if (!text || text.trim() === "") {
        console.error("[🔊 ttsService] ❌ Texte vide, impossible de générer l'audio");
        return null;
    }

    // Pre-process text to ensure better flow
    const processedText = text.trim();

    // Vérifier le cache pour éviter la régénération du même texte
    const cacheKey = processedText.substring(0, 100); // Utiliser les 100 premiers caractères comme clé
    const cachedResult = audioCache.get(cacheKey);

    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
        console.log("[🔊 ttsService] ♻️ Utilisation du cache audio pour:", processedText.substring(0, 50) + "...");
        return cachedResult.path;
    }

    console.log("[🔊 ttsService] 🎵 Génération vocale pour:", processedText.substring(0, 50) + "...");
    
    try {
        // Vérifier le quota avant d'utiliser ElevenLabs
        const canUseElevenLabs = await quotaManager.canProcessText(processedText);

        if (!canUseElevenLabs) {
            console.log("[🔊 ttsService] ⚠️ Quota ElevenLabs dépassé, basculement direct vers service local");
            const quotaStatus = quotaManager.getQuotaStatus();
            console.log(`📊 Quota: ${quotaStatus.used}/${quotaStatus.limit} (${quotaStatus.percentage}%)`);

            // Basculer directement vers le service hybride (meilleur pour l'arabe)
            const hybridAudioPath = await hybridTtsService.generateBestAudio(processedText);
            if (hybridAudioPath) {
                console.log("[🔊 ttsService] ✅ Audio généré avec succès via hybridTtsService (quota dépassé)");
                return hybridAudioPath;
            }
        }

        // ÉTAPE 1: Essayer d'abord avec le service direct ElevenLabs pour la voix féminine Asmaa
        console.log("[🔊 ttsService] Tentative avec directElevenLabsService (voix féminine Asmaa)...");
        const femaleVoicePath = await directElevenLabsService.generateFemaleVoice(processedText);
        
        if (femaleVoicePath) {
            // Succès avec la voix féminine
            console.log("[🔊 ttsService] ✅ Audio généré avec succès via directElevenLabsService");
            console.log(`[🔊 ttsService] 💾 Chemin audio: ${femaleVoicePath}`);

            // Ajouter des paramètres supplémentaires pour le cache-busting seulement si pas déjà présents
            let finalPath = femaleVoicePath;

            if (!finalPath.includes('gender=female')) {
                const genderParam = finalPath.includes('?') ? '&gender=female' : '?gender=female';
                finalPath += genderParam;
            }

            if (!finalPath.includes('&v=') && !finalPath.includes('?v=')) {
                const timestamp = Date.now();
                const versionParam = `&v=${timestamp}`;
                finalPath += versionParam;
            }

            // Mettre en cache le résultat
            audioCache.set(cacheKey, {
                path: finalPath,
                timestamp: Date.now()
            });

            return finalPath;
        }
        
        // ÉTAPE 2: Si ElevenLabs échoue, utiliser le service TTS hybride (meilleur pour l'arabe)
        console.log("[🔊 ttsService] ⚠️ Basculement vers hybridTtsService...");
        const hybridAudioPath = await hybridTtsService.generateBestAudio(processedText);

        if (hybridAudioPath) {
            console.log("[🔊 ttsService] ✅ Audio généré avec succès via hybridTtsService");
            console.log(`[🔊 ttsService] 💾 Chemin audio: ${hybridAudioPath}`);
            return hybridAudioPath;
        }
        
        // ÉTAPE 3: Dernier recours - Tenter une approche alternative
        console.error("[🔊 ttsService] ❌ Tous les services TTS ont échoué!");
        return null;
    } catch (error) {
        console.error("[🔊 ttsService] ❌ Erreur générale TTS:", error.message);
        
        // En cas d'erreur, essayer le service local
        try {
            console.log("[🔊 ttsService] ⚠️ Tentative de secours avec localTtsService...");
            const fallbackPath = await localTtsService.generateLocalAudio(processedText);
            if (fallbackPath) {
                console.log("[🔊 ttsService] ✅ Fallback réussi avec localTtsService");
                return fallbackPath;
            }
        } catch (fallbackError) {
            console.error("[🔊 ttsService] ❌ Erreur fatale TTS - Aucune option disponible:", fallbackError.message);
        }
        
        return null;
    }
}

// La fonction tryFallbackTTS n'est plus utilisée car la logique de fallback 
// est maintenant intégrée directement dans textToSpeech

module.exports = { textToSpeech };
