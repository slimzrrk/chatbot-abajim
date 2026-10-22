require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const sequelize = require("./config/db");

// Importation des routes
const userRoutes = require("./routes/auth");
const enfantRoutes = require("./routes/enfantRoutes");
const documentRoutes = require("./routes/documentRoutes");
const manuelRoutes = require("./routes/manuels");
const webinarRoutes = require("./routes/webinarRoutes");
const likeRoutes = require("./routes/likeRoutes");
const followRoutes = require("./routes/followRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const videoRoutes = require("./routes/videoRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const saleRoutes = require("./routes/saleRoutes");
const cartRoutes = require("./routes/cart");
const subscriptionRoutes = require("./routes/subscription");
const checkoutRoutes = require("./routes/checkout");
const userAvatarRoutes = require("./routes/user");
const quizRoutes = require("./routes/quizRoutes");
const walletRoutes = require("./routes/walletRoutes");
const parentDashboardRoutes = require("./routes/parentDashboard");
const teacherAuthRoutes = require("./routes/teachers/teacherRoutes");

const chatbotRoutes = require("./routes/chatbotRoutes");
const whisperRoutes = require("./routes/whisperRoutes");

const recommendationRoutes = require('./routes/recommandation'); // Routes activées

const app = express();
app.use(cors());
app.use(express.json());

// Créer le dossier uploads si nécessaire
if (!fs.existsSync('../../uploads')) {
  fs.mkdirSync('../../uploads');
}

// Routes API principales
// Dans app.js, ajoutez ces lignes
app.use('/api/recommendations', recommendationRoutes); // Routes activées
app.use("/api/users", userRoutes);
app.use("/api/enfants", enfantRoutes);
app.use("/api/manuels", manuelRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/webinars", webinarRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/avatar", userAvatarRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/parent", parentDashboardRoutes);
app.use("/api/teachers", teacherAuthRoutes);

// IA : Chatbot + Whisper
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/whisper", whisperRoutes);

// Fichiers statiques
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Serve uploads with no-cache headers and CORS to prevent browser caching
app.use("/uploads", (req, res, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}, express.static(path.join(__dirname, "../../uploads")));

// Route de base
app.get("/", (_, res) => {
  res.send("✅ Backend Abajim est opérationnel !");
});

// Connexion BDD
sequelize.sync()
  .then(() => console.log("✅ Synchronisation réussie"))
  .catch((err) => console.error("❌ Erreur de synchronisation :", err));



module.exports = app;