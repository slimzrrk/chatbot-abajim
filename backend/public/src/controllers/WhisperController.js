const { transcribeAudio } = require('../services/whisperService');

const transcribe = async (req, res) => {
  try {
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({ error: 'Aucun fichier audio envoyé.' });
    }

    console.log('🎵 Fichier audio reçu:', {
      filename: audioFile.filename,
      originalname: audioFile.originalname,
      path: audioFile.path,
      size: audioFile.size,
      mimetype: audioFile.mimetype
    });

    const result = await transcribeAudio(audioFile.path);
    const transcription = result.transcription;
    const audioDuration = result.audioDuration;

    console.log("🧠 Texte transmis pour détection :", transcription);
    console.log("🕐 Durée audio calculée :", audioDuration, "ms");

    // Retourner la transcription ET le chemin du fichier audio
    const audioPath = `/uploads/${audioFile.filename}`;
    console.log('🎵 Chemin audio retourné au frontend:', audioPath);

    res.json({
      transcription,
      audioPath,
      audioSize: audioFile.size,
      audioDuration: audioDuration
    });
  } catch (error) {
    console.error('❌ Erreur Whisper:', error);
    res.status(500).json({ error: 'Erreur lors de la transcription.' });
  }
};

module.exports = { transcribe };
