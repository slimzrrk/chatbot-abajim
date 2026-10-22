#!/bin/bash
# Script pour démarrer le service de recommandation

# Définir le répertoire du projet
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
RECOMMENDATION_DIR="$PROJECT_DIR/recommendation_service"

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier si pip est installé
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Installer les dépendances Python
echo "📦 Installation des dépendances Python..."
pip3 install -r "$RECOMMENDATION_DIR/requirements.txt"

# Vérifier si le fichier .env existe
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "⚠️ Fichier .env non trouvé. Création d'un fichier .env par défaut..."
    cat > "$PROJECT_DIR/.env" << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=abajimdb
DB_PORT=3306
RECOMMENDATION_API_URL=http://localhost:8000/api
EOF
    echo "✅ Fichier .env créé avec succès."
fi

# Démarrer le service de recommandation
echo "🚀 Démarrage du service de recommandation..."
cd "$PROJECT_DIR" && python3 -m recommendation_service.app
