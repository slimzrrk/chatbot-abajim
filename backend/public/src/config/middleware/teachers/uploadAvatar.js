const multer = require('multer');
const path = require('path');

// ✅ Destination et nom du fichier
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + Date.now() + ext);
    }
});

// ✅ Filtrer les fichiers (optionnel: seulement images)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Seules les images sont autorisées.'), false);
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
