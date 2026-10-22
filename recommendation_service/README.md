# Service de Recommandation Abajim

Ce service fournit des recommandations personnalisées pour les professeurs, les exercices et les cours en fonction des préférences et du niveau de l'étudiant.

## Fonctionnalités

- **Recommandation de professeurs** : Recommande des professeurs en fonction de la matière, du niveau et des préférences de l'étudiant.
- **Recommandation d'exercices** : Recommande des exercices adaptés au niveau de l'étudiant et à la matière demandée.
- **Recommandation de cours** : Recommande des cours supplémentaires pour approfondir les connaissances de l'étudiant.

## Prérequis

- Python 3.6+
- pip
- MySQL

## Installation

1. Installer les dépendances Python :

```bash
pip install -r recommendation_service/requirements.txt
```

2. Configurer les variables d'environnement dans un fichier `.env` à la racine du projet :

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=abajimdb
DB_PORT=3306
```

## Démarrage du service

Pour démarrer le service, exécutez le script `start_recommendation_service.sh` :

```bash
./start_recommendation_service.sh
```

Ou directement avec Python :

```bash
cd recommendation_service
python app.py
```

Le service sera disponible à l'adresse `http://localhost:8000`.

## API REST

### Vérification de l'état du service

```
GET /health
```

Exemple de réponse :

```json
{
  "status": "ok",
  "service": "recommendation-api",
  "version": "1.0.0"
}
```

### Recommandation de professeurs

```
GET /api/recommendations/teachers
```

Paramètres :
- `student_id` (optionnel) : ID de l'étudiant
- `matiere_name` (obligatoire) : Nom de la matière
- `level_id` (obligatoire) : ID du niveau
- `top_n` (optionnel, défaut: 5) : Nombre de recommandations à retourner

Exemple de réponse :

```json
[
  {
    "id": 1318,
    "full_name": "نسرين خواجة",
    "avatar": "/store/1318/avatar/67220d82b2ae1.png",
    "bio": null,
    "score": 2.9
  }
]
```

### Recommandation d'exercices

```
GET /api/recommendations/exercises
```

Paramètres :
- `student_id` (obligatoire) : ID de l'étudiant
- `matiere_name` (obligatoire) : Nom de la matière
- `top_n` (optionnel, défaut: 5) : Nombre de recommandations à retourner

### Recommandation de cours

```
GET /api/recommendations/courses
```

Paramètres :
- `student_id` (obligatoire) : ID de l'étudiant
- `matiere_name` (obligatoire) : Nom de la matière
- `top_n` (optionnel, défaut: 5) : Nombre de recommandations à retourner

## Intégration avec le backend

Le service est intégré au backend via le module `RecommendationService.js`. Ce module appelle l'API REST du service de recommandation pour obtenir les recommandations.

## Tests

Pour tester le service, exécutez le script `test_recommendation_api.sh` :

```bash
./test_recommendation_api.sh
```

## Principe de calcul du score

Le score de recommandation est calculé en fonction de plusieurs facteurs :

1. **Score de contenu** (30%) : Nombre de vidéos, webinars et fichiers créés par le professeur pour la matière et le niveau demandés.
2. **Score de popularité** (20%) : Nombre d'abonnés du professeur.
3. **Score d'interaction** (30%) : Nombre de likes, vues et temps de visionnage des vidéos du professeur.
4. **Bonus de similarité** (20%) : Basé sur les préférences d'étudiants similaires (filtrage collaboratif).

## Dépannage

Si le service ne démarre pas, vérifiez les points suivants :

1. Les dépendances Python sont-elles installées ?
2. Le fichier `.env` est-il correctement configuré ?
3. La base de données MySQL est-elle accessible ?
4. Le port 8000 est-il disponible ?

## Auteurs

- Équipe Abajim
