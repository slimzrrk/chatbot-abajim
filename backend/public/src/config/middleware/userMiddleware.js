const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; 

// Middleware pour authentifier avec toutes les infos nécessaires
const authenticateWithFullUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(403).json({ error: "Token manquant" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });

    req.user = {
      id: user.id,
      role_id: user.role_id,
      full_name: user.full_name,
      level_id: user.level_id,
      phone_number: user.mobile,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
};

module.exports = authenticateWithFullUser;
