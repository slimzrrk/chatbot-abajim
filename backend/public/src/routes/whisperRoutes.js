const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { transcribe } = require('../controllers/WhisperController');

const router = express.Router();

// Config multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Chemin absolu vers backend/uploads depuis backend/public/src/routes/
    const uploadPath = path.join(__dirname, '../../../uploads/');
    console.log('🎵 Multer destination configurée:', uploadPath);
    console.log('🎵 Chemin absolu calculé:', path.resolve(uploadPath));

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('🎵 Répertoire uploads créé:', uploadPath);
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const filename = 'audio_' + Date.now() + path.extname(file.originalname);
    console.log('🎵 Nom de fichier généré:', filename);
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

router.post('/transcribe', upload.single('audio'), transcribe);

module.exports = router;
