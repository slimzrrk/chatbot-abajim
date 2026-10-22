const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateTokenChild = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(403).json({ error: "Token manquant" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.role_id !== 3) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    req.user = user.dataValues; // ✅✅✅ FIX -> seulement les données pures

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
};

module.exports = authenticateTokenChild;
