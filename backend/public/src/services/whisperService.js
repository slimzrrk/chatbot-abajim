const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Fonction pour obtenir la durée audio avec ffmpeg
const getAudioDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("❌ Erreur lors de l'obtention de la durée audio:", err);
        resolve(null); // Retourner null en cas d'erreur plutôt que de rejeter
      } else {
        const duration = metadata.format.duration;
        const durationMs = Math.round(duration * 1000); // Convertir en millisecondes
        console.log(`🕐 Durée audio détectée: ${duration}s (${durationMs}ms)`);
        resolve(durationMs);
      }
    });
  });
};

const transcribeAudio = async (filePath) => {
  console.log("🔍 Fichier reçu pour conversion :", filePath);

  // Obtenir la durée audio avant conversion
  const audioDuration = await getAudioDuration(filePath);

  const outputPath = filePath.replace(path.extname(filePath), '.wav');

  // 🔁 Conversion en WAV avec FFmpeg
  await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .toFormat('wav')
      .on('end', () => {
        console.log("✅ Fichier converti :", outputPath);
        resolve();
      })
      .on('error', (err) => {
        console.error("❌ Erreur de conversion FFmpeg :", err);
        reject(err);
      })
      .save(outputPath);
  });

  // 🔊 Envoi à Whisper (OpenAI)
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(outputPath),
    model: 'whisper-1',
    language: 'ar',
    response_format: 'text',
  });

  // Optionnel : supprimer les fichiers temporaires
  fs.unlinkSync(outputPath);

  return {
    transcription: response,
    audioDuration: audioDuration
  };
};

module.exports = { transcribeAudio };
