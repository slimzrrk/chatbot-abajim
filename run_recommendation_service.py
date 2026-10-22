#!/usr/bin/env python3
"""
Script pour exécuter le service de recommandation.
"""

import sys
import os

# Ajouter le répertoire parent au chemin de recherche Python
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Importer et exécuter l'application Flask
from recommendation_service.app import app

if __name__ == '__main__':
    # Récupérer le port depuis les variables d'environnement ou utiliser 8000 par défaut
    port = int(os.environ.get('PORT', 8000))
    
    # Démarrer l'application
    app.run(debug=True, host='0.0.0.0', port=port)
