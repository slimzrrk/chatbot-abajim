const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.User;
const Wallet = db.Wallet;

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

/**
 * ✅ Enregistrer un nouvel utilisateur
 */
const registerUser = async (data) => {
  try {
    const { full_name, mobile, password, role_id } = data;

    // 📌 Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { mobile } });
    if (existingUser) throw new Error("Un utilisateur avec ce numéro existe déjà.");


    const hashedPassword = await bcrypt.hash(password, 10);


    // 📌 Création de l'utilisateur
    const newUser = await User.create({
      full_name,
      mobile,
      password: hashedPassword,
      role_id,
      status: "inactive",
    });
    await Wallet.create({ user_id: newUser.id, balance: 0 });

    // 📌 Génération du Token JWT
    const token = jwt.sign(
      { id: newUser.id, role_id: newUser.role_id },
      SECRET_KEY,
      { expiresIn: "6480h" }
    );

    console.log("✅ User registered successfully:", token);

    return { token, user: newUser };
  } catch (error) {
    console.error("❌ Erreur dans registerUser:", error.message);
    throw new Error(error.message || "Échec de l'enregistrement.");
  }
};

/**
 * ✅ Connexion de l'utilisateur
 */
const loginUser = async (mobile, password) => {
  try {


    // 📌 Étape 1: Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { mobile } });

    if (!user) {

      throw new Error("Numéro de mobile ou mot de passe incorrect.");
    }


    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error("Numéro de mobile ou mot de passe incorrect.");
    }

    // 📌 Étape 3: Générer un token JWT
    const token = jwt.sign(
      { id: user.id, role_id: user.role_id },
      SECRET_KEY,
      { expiresIn: "6480h" }
    );

    console.log(`✅ Token généré pour l'utilisateur ${user.id}: ${token}`);

    return { token, user };
  } catch (error) {
    console.error("❌ Erreur dans loginUser:", error.message);
    throw new Error(error.message);
  }
};


// ✅ Fetch Logged-In User (Parent)
const getLoggedInUser = async (userId) => {
    try {

        const user = await User.findOne({
            where: { id: userId }, 
            attributes: ["id", "full_name", "mobile","avatar"], 
        });

        if (!user) {
            return { error: "User not found" };
        }
        return user;
    } catch (error) {
        console.error("❌ Error fetching user info:", error.message);
        return { error: error.message };
    }
};
const uploadAvatar = async (userId, filePath) => {
  try {
    await User.update({ avatar: filePath }, { where: { id: userId } });
    return { avatar: filePath };
  } catch (error) {
    console.error("❌ Erreur dans uploadAvatar (service):", error.message);
    throw new Error("Échec de la mise à jour de l’avatar.");
  }
};
module.exports = {
  registerUser,
  loginUser,
  getLoggedInUser,
  uploadAvatar,
  
};
