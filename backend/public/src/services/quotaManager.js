/**
 * Gestionnaire de quota ElevenLabs
 * Surveille l'utilisation et bascule vers le service local si nécessaire
 */

const axios = require('axios');

class QuotaManager {
    constructor() {
        this.lastQuotaCheck = 0;
        this.quotaInfo = null;
        this.isQuotaExceeded = false;
        this.checkInterval = 5 * 60 * 1000; // Vérifier toutes les 5 minutes
    }

    /**
     * Vérifie le quota ElevenLabs
     */
    async checkQuota() {
        try {
            const now = Date.now();
            
            // Éviter les vérifications trop fréquentes
            if (now - this.lastQuotaCheck < this.checkInterval) {
                return this.quotaInfo;
            }

            const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY?.trim().replace(/[^a-zA-Z0-9_]/g, '');
            
            if (!ELEVENLABS_API_KEY) {
                console.error('❌ Clé API ElevenLabs manquante');
                this.isQuotaExceeded = true;
                return null;
            }

            const response = await axios.get('https://api.elevenlabs.io/v1/user', {
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY
                },
                timeout: 5000
            });

            this.quotaInfo = response.data.subscription;
            this.lastQuotaCheck = now;

            // Vérifier si le quota est dépassé
            const { character_count, character_limit } = this.quotaInfo;
            this.isQuotaExceeded = character_count >= character_limit;

            if (this.isQuotaExceeded) {
                console.warn(`⚠️ Quota ElevenLabs dépassé: ${character_count}/${character_limit} caractères`);
                console.warn('🔄 Basculement automatique vers le service TTS local');
            } else {
                const remaining = character_limit - character_count;
                console.log(`✅ Quota ElevenLabs OK: ${remaining} caractères restants`);
            }

            return this.quotaInfo;

        } catch (error) {
            console.error('❌ Erreur lors de la vérification du quota:', error.message);
            
            // En cas d'erreur 401, considérer que le quota est dépassé
            if (error.response?.status === 401) {
                console.warn('🔑 Erreur d\'authentification ElevenLabs - quota probablement dépassé');
                this.isQuotaExceeded = true;
            }
            
            return null;
        }
    }

    /**
     * Vérifie si on peut utiliser ElevenLabs
     */
    async canUseElevenLabs() {
        await this.checkQuota();
        return !this.isQuotaExceeded;
    }

    /**
     * Estime le nombre de caractères d'un texte
     */
    estimateCharacters(text) {
        return text ? text.length : 0;
    }

    /**
     * Vérifie si un texte peut être traité avec le quota restant
     */
    async canProcessText(text) {
        const characters = this.estimateCharacters(text);
        
        if (!await this.canUseElevenLabs()) {
            return false;
        }

        if (!this.quotaInfo) {
            return false;
        }

        const remaining = this.quotaInfo.character_limit - this.quotaInfo.character_count;
        return characters <= remaining;
    }

    /**
     * Obtient les informations de quota formatées
     */
    getQuotaStatus() {
        if (!this.quotaInfo) {
            return 'Quota non vérifié';
        }

        const { character_count, character_limit } = this.quotaInfo;
        const remaining = character_limit - character_count;
        const percentage = ((character_count / character_limit) * 100).toFixed(1);

        return {
            used: character_count,
            limit: character_limit,
            remaining: remaining,
            percentage: percentage,
            exceeded: this.isQuotaExceeded
        };
    }
}

// Instance singleton
const quotaManager = new QuotaManager();

module.exports = quotaManager;
