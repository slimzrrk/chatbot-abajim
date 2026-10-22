const jwt = require('jsonwebtoken');
const { secret } = require('../../jwt');
const { User } = require('../../../models');

const authTeacherToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) return res.status(401).json({ message: "No token provided." });

    try {
        const decoded = jwt.verify(token, secret);
        console.log("✅ Token decoded:", decoded);

        const user = await User.findByPk(decoded.id);
        console.log("✅ User found in DB:", user);

        if (!user || user.role_id !== 4) {
            return res.status(403).json({ message: "Access forbidden." });
        }

        req.user = user.get({ plain: true }); // ✅ FIXED: Convert instance -> plain object
        next();
    } catch (err) {
        console.error("❌ Invalid token:", err.message);
        return res.status(401).json({ message: "Invalid token." });
    }
};

module.exports = authTeacherToken;
