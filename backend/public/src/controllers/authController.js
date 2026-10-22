const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 📌 Envoyer OTP
exports.sendOTP = async (req, res) => {
    const { mobile } = req.body;

    try {
        const user = await User.findOne({ where: { mobile } });
        if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé.' });

        // Générer un OTP aléatoire à 4 chiffres
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Expire en 5 minutes

        // Stocker l'OTP dans la base de données
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        console.log(`📩 OTP pour ${mobile} : ${otp}`); // À remplacer par une API SMS en prod

        res.json({ message: 'OTP envoyé avec succès.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error });
    }
};

// 📌 Vérifier OTP
exports.verifyOTP = async (req, res) => {
    const { mobile, otp } = req.body;

    try {
        const user = await User.findOne({ where: { mobile } });

        if (!user || user.otp !== otp || new Date() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP invalide ou expiré.' });
        }

        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({ message: 'OTP vérifié avec succès.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error });
    }
};

// 📌 Réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
    const { mobile, newPassword } = req.body;

    try {
        const user = await User.findOne({ where: { mobile } });

        if (!user) {
            return res.status(400).json({ message: 'Utilisateur non trouvé.' });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.', error });
    }
};
//switching accounts between the childrens 
// ✅ Ensure SECRET_KEY is properly defined
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // ✅ Fix this!

exports.switchChildSession = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user found in request" });
    }

    const { childId } = req.body;
    const parentId = req.user.id;


    if (!childId) {
      return res.status(400).json({ error: "childId is required" });
    }

    // ✅ Find the child and verify parent-child relationship
    const child = await User.findOne({
      where: { id: childId, role_id: 8, organ_id: parentId },
      attributes: ["id", "full_name", "role_id", "level_id", "avatar"],
    });

    if (!child) {
      return res.status(403).json({ error: "Unauthorized: This child does not belong to you." });
    }

    // ✅ Generate a new token for the child session
    const token = jwt.sign(
      { id: child.id, role_id: child.role_id },
      SECRET_KEY,  // ✅ Use the correct variable
      { expiresIn: "6480h" }
    );

    res.status(200).json({ token, child: child.dataValues });

  } catch (error) {
    console.error("❌ Error switching child session:", error.message);
    res.status(500).json({ error: "Server error while switching child" });
  }
};