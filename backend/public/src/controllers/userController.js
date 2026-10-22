const userService = require("../services/userService");

/**
 * ✅ Inscription d'un utilisateur
 */
const register = async (req, res) => {
  try {
    const { full_name, mobile, password, confirm_password, role_id } = req.body;

    // ✅ Validation utilisateur côté controller
    if (!full_name || !mobile || !password || !confirm_password || !role_id) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: "Les mots de passe ne correspondent pas." });
    }

    // ✅ Appel du service avec données valides
    const result = await userService.registerUser({ full_name, mobile, password, role_id });
    res.status(201).json(result);

  } catch (error) {
    console.error("❌ Erreur lors de l'inscription:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ Connexion d'un utilisateur
 */
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ error: "Mobile et mot de passe sont requis." });
    }

    const result = await userService.loginUser(mobile, password);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Erreur lors de la connexion :", error.message);
    res.status(500).json({ error: error.message });
  }
};
// ✅ Get Logged-In User Info
const getLoggedInUser = async (req, res) => {
  try {
      const userId = req.user.id;  // ✅ Get user ID from Auth Token
      const user = await userService.getLoggedInUser(userId);

      if (user.error) {
          return res.status(404).json({ error: user.error });
      }

      return res.status(200).json(user);
  } catch (error) {
      console.error("❌ Error fetching user info:", error.message);
      return res.status(500).json({ error: "Server error while fetching user info" });
  }
};
// adding personnal image for the parent 
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu." });
    }

    const filePath = `/uploads/avatars/${req.file.filename}`;

    const result = await userService.uploadAvatar(userId, filePath);

    return res.status(200).json({
      message: "Avatar mis à jour avec succès",
      avatar: result.avatar,
    });
  } catch (error) {
    console.error("❌ Erreur uploadAvatar (controller):", error.message);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  getLoggedInUser,
 uploadAvatar,
};
