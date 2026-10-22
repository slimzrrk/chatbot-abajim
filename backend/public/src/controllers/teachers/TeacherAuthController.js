const TeacherAuthService = require('../../services/teachers/TeacherAuthService');

class TeacherAuthController {

    static async register(req, res) {
        console.log("➡️ [Controller] Register called with body:", req.body);
        try {
            const teacher = await TeacherAuthService.register(req.body);
            res.status(201).json({ message: "Teacher registered successfully.", teacher });
        } catch (err) {
            console.error("❌ [Controller] Register error:", err.message);
            res.status(400).json({ message: err.message });
        }
    }

    static async login(req, res) {
        console.log("➡️ [Controller] Login called with body:", req.body);
        try {
            const { token, user } = await TeacherAuthService.login(req.body);
            res.status(200).json({ token, user });
        } catch (err) {
            console.error("❌ [Controller] Login error:", err.message);
            res.status(400).json({ message: err.message });
        }
    }
    
}

module.exports = TeacherAuthController;
