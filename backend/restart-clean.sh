#!/bin/bash

echo "🔄 REDÉMARRAGE PROPRE DU BACKEND ABAJIM"
echo "======================================"

# Arrêter tous les processus Node.js liés au projet
echo "🛑 Arrêt des processus Node.js en cours..."
pkill -f "node.*index.js" 2>/dev/null || echo "Aucun processus Node trouvé"
pkill -f "nodemon.*index.js" 2>/dev/null || echo "Aucun processus Nodemon trouvé"

# Attendre un peu pour que les processus se terminent
sleep 2

# Nettoyer les fichiers audio
echo "🧹 Nettoyage des fichiers audio..."
node cleanup-audio.js

# Vérifier que le port 5001 est libre
echo "🔍 Vérification du port 5001..."
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Le port 5001 est encore occupé, tentative de libération..."
    lsof -ti:5001 | xargs kill -9 2>/dev/null || echo "Impossible de libérer le port"
    sleep 2
fi

# Redémarrer le serveur
echo "🚀 Redémarrage du serveur..."
echo "📝 Logs à surveiller :"
echo "   ✅ '⏭️ Nettoyage audio ignoré' (normal)"
echo "   ✅ '♻️ Utilisation du cache audio' (optimisation)"
echo "   ❌ Redémarrages en boucle (ne devrait plus arriver)"
echo ""
echo "🎯 Pour arrêter : Ctrl+C"
echo "======================================"

npm run dev
