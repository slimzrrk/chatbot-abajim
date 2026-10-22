const manuelService = require("../services/manuelService");


/**
 * 🔹 Récupérer la liste de tous les manuels scolaires disponibles
 */
exports.getAllManuels = async (req, res) => {
    try {
        const manuels = await manuelService.getAllManuels();
        res.status(200).json(manuels);
    } catch (error) {
        console.error("❌ Erreur dans getAllManuels :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

/**
 * 🔹 Récupérer un manuel spécifique avec ses documents et vidéos
 */
exports.getManuelById = async (req, res) => {
    try {
        const manuel = await manuelService.getManuelById(req.params.id);

        if (!manuel) return res.status(404).json({ message: "Manuel non trouvé" });

        res.status(200).json(manuel);
    } catch (error) {
        console.error("❌ Erreur dans getManuelById :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

/**
 * 🔹 Récupérer la liste des manuels scolaires par niveau
 */
exports.getManuelsByLevel = async (req, res) => {
    try {
        const { level_id } = req.params;

        // Vérifier si le level_id est valide
        const manuels = await manuelService.getManuelsByLevel(level_id);

        if (!manuels || manuels.length === 0) {
            return res.status(404).json({ error: "Aucun manuel trouvé pour ce niveau." });
        }

        res.status(200).json(manuels);
    } catch (error) {
        console.error("❌ Erreur dans getManuelsByLevel :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};


