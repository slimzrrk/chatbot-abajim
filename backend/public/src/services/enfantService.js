const User = require("../models/User");
const SchoolLevel = require("../models/SchoolLevel");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";
const garconImages = [
    "/boy1.jpeg",
    "/boy2.jpeg",
    "/f14.png",
    "/f16.png"
];

const filleImages = [
    "/girl1.jpeg",
    "/girl2.jpeg",
    "/girl3.jpeg",
    "/girl4.jpeg"
];

// ✅ **Fetch all children for a parent**
exports.getChildrenByParent = async (parentId) => {
    try {
        console.log(`📌 Fetching children for parentId: ${parentId}`);

        const enfants = await User.findAll({
            where: { organ_id: parentId, role_id: 8 }, // ✅ Get only children (role_id = 8)
            attributes: ["id", "full_name", "role_id", "level_id", "avatar", "created_at", "sexe"]
        });

        // ✅ Ensure correct avatar URLs
        const updatedChildren = enfants.map(child => ({
            ...child.dataValues,
            avatar: child.avatar.startsWith("http") ? child.avatar : `${child.avatar}`
        }));

        return updatedChildren;
    } catch (error) {
        console.error("❌ Error fetching children:", error.message);
        return { error: "Erreur lors de la récupération des enfants." };
    }
};
exports.getChildByParent = async (parentId) => {
    try {
        console.log(`📌 Fetching child for parentId: ${parentId}`);

        const enfants = await User.findOne({
            where: { organ_id: parentId, role_id: 8 }, // ✅ Get only children (role_id = 8)
            attributes: ["id", "full_name", "role_id", "level_id", "avatar", "created_at", "sexe"]
        });

        // ✅ Ensure correct avatar URLs
        // const updatedChildren = enfants.map(child => ({
        //     ...child.dataValues,
        //     avatar: child.avatar.startsWith("http") ? child.avatar : `${child.avatar}`
        // }));

        return enfants;
    } catch (error) {
        console.error("❌ Error fetching child:", error.message);
        return { error: "Erreur lors de la récupération de l'enfant." };
    }
};
// ✅ **Create a new child**
exports.createChild = async (parent, data) => {
    try {
        const parentId = parent.id;

        // ✅ Check if the parent already has 4 children
        const childCount = await User.count({ where: { organ_id: parentId, role_id: 8 } });
        if (childCount >= 4) {
            return { error: "Vous avez atteint le nombre maximum d'enfants autorisés (4)." };
        }

        // ✅ Check if `level_id` exists
        const schoolLevel = await SchoolLevel.findByPk(data.level_id);
        if (!schoolLevel) {
            return { error: "Le niveau scolaire spécifié n'existe pas." };
        }

        // ✅ Assign avatar based on gender
        const imagePool = data.sexe === "Garçon" ? garconImages : filleImages;
        const avatarPath = imagePool[Math.floor(Math.random() * imagePool.length)];
        const fullAvatarURL = `${avatarPath}`;

        // ✅ Create the child as a `user`
        const newChild = await User.create({
            full_name: data.Nom,
            role_name: "enfant",
            role_id: 8, // ✅ Child Role
            organ_id: parentId, // ✅ Link child to parent
            level_id: data.level_id,
            sexe: data.sexe,
            status: "active",
            avatar: fullAvatarURL,
            created_at: new Date(),
            verified: 1,
            language: "AR",
      
        });
        const token = jwt.sign(
            { id: newChild.id, role_id: newChild.role_id },
            SECRET_KEY,
            { expiresIn: "6480h" }
          );
        return { user: newChild ,token};
    } catch (error) {
        console.error("❌ Error creating child:", error.message);
        return { error: error.message || "Erreur lors de la création de l'enfant." };
    }
};

// ✅ **Update a child**
exports.updateChild = async (parentId, childId, data) => {
    try {
        // ✅ Check if the child belongs to this parent
        const enfant = await User.findOne({ where: { id: childId, organ_id: parentId, role_id: 8 } });

        if (!enfant) {
            return { error: "Enfant non trouvé ou n'appartient pas à ce parent." };
        }

        // ✅ Update child data
        await enfant.update({ full_name: data.nom, level_id: data.level_id, sexe: data.sexe });

        return enfant;
    } catch (error) {
        console.error("❌ Error updating child:", error.message);
        return { error: error.message || "Erreur lors de la mise à jour de l'enfant." };
    }
};

// ✅ **Delete a child**
exports.deleteChild = async (parentId, childId) => {
    try {
        const enfant = await User.findOne({ where: { id: childId, organ_id: parentId, role_id: 8 } });

        if (!enfant) {
            return { error: "Enfant non trouvé ou n'appartient pas à ce parent." };
        }

        await enfant.destroy();
        return { message: "Enfant supprimé avec succès." };
    } catch (error) {
        console.error("❌ Error deleting child:", error.message);
        return { error: error.message || "Erreur lors de la suppression de l'enfant." };
    }
};
exports.setChildAvatar = async (childId, avatarPath) => {
    try {
      const child = await User.findByPk(childId);
      if (!child || child.role_id !== 8) return { error: "Enfant non trouvé" };
  
      await child.update({ avatar: avatarPath });
      return { avatar: avatarPath };
    } catch (error) {
      console.error("❌ Error updating child avatar:", error.message);
      return { error: "Erreur lors de la mise à jour de l'avatar" };
    }
  };