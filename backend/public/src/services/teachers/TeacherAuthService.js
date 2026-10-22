const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { secret, expiresIn } = require('../../config/jwt');

const getRoleName = (role_id) => {
    switch(role_id) {
        case 3: return "admin";
        case 4: return "teacher";
        default: return "unknown";
    }
};

class TeacherAuthService {

    static async register(data) {
        console.log("📥 [Service] register called with data:", data);

        const { full_name, email, mobile, password, confirm_password } = data;

        if (!full_name || !email || !mobile || !password || !confirm_password)
            throw new Error("All fields are required.");

        if (password !== confirm_password)
            throw new Error("Passwords do not match.");

        const existing = await User.findOne({ where: { email } });
        if (existing) throw new Error("Email already registered.");

        const existingMobile = await User.findOne({ where: { mobile } });
        if (existingMobile) throw new Error("Mobile already registered.");

        const hashedPassword = await bcrypt.hash(password, 10);

        const teacher = await User.create({
            full_name,
            email,
            mobile,
            password: hashedPassword,
            role_id: 4
        });

        await teacher.reload();

        console.log("✅ [Service] Teacher registered:", teacher.id);

        return {
            id: teacher.id,
            full_name: teacher.full_name,
            email: teacher.email,
            mobile: teacher.mobile,
            avatar: teacher.avatar,
            role_id: teacher.role_id,
            role_name: getRoleName(teacher.role_id)
        };
    }

    static async login(data) {
        console.log("📥 [Service] login called with data:", data);

        const { email, password } = data;

        const user = await User.findOne({ where: { email, role_id: 4 } });
        console.log("🔎 [Service] User fetched for login:", user);

        if (!user) throw new Error("Invalid credentials.");

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("🔑 [Service] Password match:", isMatch);

        if (!isMatch) throw new Error("Invalid credentials.");

        // ✅ ✅ ✅ NO MORE generateToken → DIRECT jwt.sign
        const token = jwt.sign({ id: user.id }, secret, { expiresIn });
        console.log("✅ [Service] Token generated for user:", user.id);

        return {
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                mobile: user.mobile,
                avatar: user.avatar,
                role_id: user.role_id,
                role_name: getRoleName(user.role_id)
            }
        };
    }

    
}

module.exports = TeacherAuthService;
