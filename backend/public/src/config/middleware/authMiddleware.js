
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; 

const authenticateToken = async (req, res, next) => {
  try {

    // ✅ Extract token
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log("🔍 Extracted Token:", token); 

    if (!token) {
      console.error("❌ No token found");
      return res.status(403).json({ error: "Accès refusé, token manquant !" });
    }

    // ✅ Decode token
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      console.error("❌ Decoded token is invalid:", decoded);
      return res.status(401).json({ error: "Token invalide." });
    }
    // ✅ Fetch user from database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      console.error("❌ User not found in database:", decoded.id);
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // ✅ Convert Sequelize model to plain object
    req.user = {
      id: user.id,
      role_id: user.role_id,
      full_name: user.full_name,
    };
    
    next();
  } catch (error) {
    console.error("❌ Authentication Error:", error.message);
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
};
const authenticateWithFullUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(403).json({ error: "Token manquant" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id); // ou `User.findOne(...)`

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });

    req.user = {
      id: user.id,
      role_id: user.role_id,
      full_name: user.full_name,
      level_id: user.level_id,
      phone_number: user.phone_number,
      address: user.address,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
};

module.exports = authenticateToken;

