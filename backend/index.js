const app = require('./public/src/app'); // Chemin correct vers app.js
const dotenv = require("dotenv");

dotenv.config(); // Charger les variables d'environnement à partir du fichier .env

const PORT = process.env.PORT || 3000;

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
