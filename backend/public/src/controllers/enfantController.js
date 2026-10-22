const enfantService = require("../services/enfantService");

// ✅ **Get all children for the authenticated parent**
exports.getChildrenByParent = async (req, res) => {
    try {
        const parentId = req.user.id;

        const enfants = await enfantService.getChildrenByParent(parentId);

        if (enfants.error) {
            return res.status(400).json({ error: enfants.error });
        }

        return res.status(200).json(enfants);
    } catch (error) {
        return res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
// ✅ Get children by a specific `parent_id` (Used for Admins or Debugging)
exports.getChildrenByParentId = async (req, res) => {
  try {
      const { id } = req.params;

      const enfants = await enfantService.getChildrenByParent(id);

      if (enfants.error) {
          return res.status(400).json({ error: enfants.error });
      }

      return res.status(200).json(enfants);
  } catch (error) {
      return res.status(500).json({ error: "Erreur interne du serveur." });
  }
};
// ✅ Get child by a specific `parent_id` (Used for Admins or Debugging)
exports.getChildByParentId = async (req, res) => {
    try {
        const { id } = req.params;
  
        const enfants = await enfantService.getChildByParent(id);
  
        if (enfants.error) {
            return res.status(400).json({ error: enfants.error });
        }
  
        return res.status(200).json(enfants);
    } catch (error) {
        return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  };
// ✅ **Add a new child**
exports.addChild = async (req, res) => {
    try {
        const parent = req.user;
        const { Nom, sexe, level_id } = req.body;

        if (!Nom || !sexe || !level_id) {
            return res.status(400).json({ error: "Tous les champs sont requis." });
        }

        const newChild = await enfantService.createChild(parent, { Nom, sexe, level_id });

        if (newChild.error) {
            return res.status(400).json({ error: newChild.error });
        }

        return res.status(201).json({
            message: "Enfant ajouté avec succès.",
            enfant: newChild.user,
            token: newChild.token
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// ✅ **Update a child**
exports.updateChild = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { id } = req.params;
        const { nom, level_id } = req.body;

        const updatedEnfant = await enfantService.updateChild(parentId, id, { nom, level_id });

        if (updatedEnfant.error) {
            return res.status(400).json({ error: updatedEnfant.error });
        }

        return res.json({ message: "Enfant mis à jour avec succès.", enfant: updatedEnfant });
    } catch (error) {
        return res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

// ✅ **Delete a child**
exports.deleteChild = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { id } = req.params;

        const deleted = await enfantService.deleteChild(parentId, id);

        if (deleted.error) {
            return res.status(400).json({ error: deleted.error });
        }

        return res.json({ message: "Enfant supprimé avec succès." });
    } catch (error) {
        return res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
exports.uploadKidAvatar = async (req, res) => {
    try {
      const childId = req.params.id;
      if (!req.file) return res.status(400).json({ error: "Fichier manquant" });
  
      const avatarPath = `/uploads/kids/${req.file.filename}`;
      const result = await enfantService.setChildAvatar(childId, avatarPath);
  
      if (result.error) return res.status(400).json({ error: result.error });
      return res.json({ message: "Avatar mis à jour", avatar: result.avatar });
    } catch (err) {
      console.error("Erreur update avatar enfant:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  };