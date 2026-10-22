const documentService = require("../services/documentService");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const getAllDocuments = async (req, res) => {
  try {

    const documents = await documentService.getAllDocuments();

   // console.log("✅ Documents récupérés avec succès :", documents);
    res.status(200).json(documents);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des documents :", error.message);
    res.status(500).json({ error: "Erreur lors de la récupération des documents." });
  }
};

const getDocumentsByManuel = async (req, res) => {
  try {
    const { manuel_id } = req.params;

    if (!manuel_id) {
      return res.status(400).json({ error: "manuel_id est requis." });
    }

    const documents = await documentService.getDocumentsByManuel(manuel_id);

    res.status(200).json(documents);
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des documents pour manuel_id ${req.params.manuel_id}:`, error.message);
    res.status(500).json({ error: "Erreur lors de la récupération des documents du manuel." });
  }
};

const createDocument = async (req, res) => {
  try {

    if (!req.body.name || !req.body.pdf || !req.body.manuel_id) {
      return res.status(400).json({ error: "Les champs name, pdf et manuel_id sont requis." });
    }

    const document = await documentService.createDocument(req.body);
    res.status(201).json({ message: "Document ajouté avec succès", document });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du document :", error.message);
    res.status(500).json({ error: "Erreur lors de l'ajout du document." });
  }
};
// 🆕 New function to fetch the correction video URL
const getCorrectionVideoUrl = async (req, res) => {

  try {
    const { manuel_id, icon, page } = req.body;

    if (!manuel_id || !icon || !page) {
      return res.status(400).json({ error: "manuel_id, icon et page sont requis." });
    }

    const result = await documentService.getCorrectionVideoUrl(manuel_id, icon, page);
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error fetching correction video URL:", error.message);
    return res.status(500).json({ error: "Impossible de récupérer la vidéo." });
  }
};

/**
 * Enregistre une vue pour une vidéo
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Réponse JSON
 */
const recordVideoView = async (req, res) => {
  try {
    const { videoId, userId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: "videoId est requis" });
    }

    // Vérifier si l'ID de l'utilisateur est fourni dans le corps de la requête
    if (!userId) {
      // Si l'ID de l'utilisateur n'est pas fourni dans le corps de la requête, essayer de le récupérer à partir du token JWT
      let tokenUserId = null;
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          tokenUserId = decoded.id;
        } catch (error) {
          console.error("❌ Erreur de décodage du token JWT:", error.message);
        }
      }

      if (!tokenUserId) {
        return res.status(400).json({ error: "userId est requis (soit dans le corps de la requête, soit dans le token JWT)" });
      }

      // Utiliser l'ID de l'utilisateur du token
      const result = await documentService.recordVideoView(tokenUserId, videoId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    }

    // Utiliser l'ID de l'utilisateur fourni dans le corps de la requête (prioritaire)
    console.log(`📝 Enregistrement de vue pour l'enfant ID=${userId} sur la vidéo ID=${videoId}`);
    const result = await documentService.recordVideoView(userId, videoId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement de la vue:", error.message);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement de la vue" });
  }
};

module.exports = {
  getAllDocuments,
  getDocumentsByManuel,
  createDocument,
  getCorrectionVideoUrl,
  recordVideoView,
};
