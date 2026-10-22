const db = require("../models");
const Manuel = db.Manuel;
const Material = db.Material;
const SchoolLevel = db.SchoolLevel;

/**
 * 🔹 Vérifier si un niveau scolaire existe
 */
exports.checkLevelExists = async (level_id) => {
    const level = await SchoolLevel.findByPk(level_id);
    return level !== null;
};

/**
 * 🔹 Récupérer tous les manuels disponibles
 */
exports.getAllManuels = async () => {
    return await Manuel.findAll({
        include: [{ model: Material, as: "material", attributes: ["name"] }],
    });
};

/**
 * 🔹 Récupérer un manuel par ID
 */
exports.getManuelById = async (id) => {
    return await Manuel.findOne({
        where: { id },
        include: [{ model: Material, as: "material", attributes: ["name"] }],
    });
};

// ✅ Mapping manuel entre levels et material_id
const manualLevelMapping = {
    6: [1, 1, 2],
    7: [3, 4, 4],
    8: [5, 5, 6, 7, 7, 8],
    9: [9, 9, 10, 11, 11, 12, 12],
    10: [13, 14, 14, 15, 16, 16, 17, 17],
    11: [18, 18, 19, 20, 21, 21, 22, 22, 23]
};

/**
 * 🔹 Récupérer les manuels par niveau scolaire (en filtrant par `material_id`)
 */
exports.getManuelsByLevel = async (level_id) => {
    try {
        if (!manualLevelMapping[level_id]) {
            return [];
        }

        const manuels = await Manuel.findAll({
            where: {
                material_id: manualLevelMapping[level_id]
            },
            attributes: ["id", "name", "material_id", "logo", "created_at", "updated_at"],
            include: [{
                model: Material,
                as: "material",
                attributes: ["name"]
            }],
        });

        // ✅ Filtrer une deuxième fois en JS pour s'assurer qu'on n'a que les bons niveaux
        const filteredManuels = manuels.filter(m => manualLevelMapping[level_id].includes(m.material_id));
        return filteredManuels;
    } catch (error) {
        console.error("❌ Erreur dans getManuelsByLevel:", error);
        return [];
    }
};
exports.getDocumentsByManuel = async (manuelId) => {
    const db = require('../models');
    return await db.Document.findAll({
        where: { manuel_id: manuelId },
        attributes: ['name', 'nombre_page', 'pdf', '3d_path_teacher', 'pathenfant']
    });
};

exports.getAvailableSubjectsByLevel = async (level_id) => {
    try {
        const materials = await Material.findAll({
            where: { section_id: level_id }, // section_id représente le niveau scolaire
            attributes: ["id", "name"]
        });

        return materials;
    } catch (error) {
        console.error("❌ Erreur dans getAvailableSubjectsByLevel:", error);
        return [];
    }
};


