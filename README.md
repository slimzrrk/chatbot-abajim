# Chatbot vocal Abajim

Chatbot éducatif vocal intégré à l'application mobile **Abajim**, destinée aux élèves du primaire et à leurs parents. L'enfant pose une question à l'écrit ou à l'oral (arabe / français). Le chatbot comprend la demande, répond par du texte et une voix synthétisée, puis propose ou ouvre directement la ressource adaptée : cours, exercice, manuel, professeur, séance en direct ou abonnement.

## Fonctionnalités

- **Bulle de chat flottante** disponible sur tous les écrans de l'application.
- **Interaction vocale** : enregistrement de la voix, transcription avec OpenAI Whisper, réponse lue par synthèse vocale (ElevenLabs, avec repli Google Cloud TTS / Azure Speech / audio local).
- **Compréhension du langage** : détection d'intention et extraction d'entités (matière, niveau, manuel, page, professeur) avec GPT-4o-mini et des règles métier, plus une mémoire de conversation.
- **Navigation intelligente** : cartes interactives qui ouvrent le cours, l'exercice, la page du manuel ou le profil du professeur demandé.
- **Recommandations personnalisées** de professeurs, cours et exercices, fournies par un microservice Python (filtrage collaboratif + contenu, gestion du démarrage à froid).
- **Multi-enfants** : un historique de conversation séparé pour chaque enfant d'un compte parent.

Intentions gérées : `voir_cours`, `voir_exercice(s)`, `voir_manuels`, `voir_meets`, `voir_profil_prof`, `recommander_professeur`, `recommander_cours`, `recommander_exercice`, `abonnement_platforme`, `abonnement_prof`, `storytime`, `question_generale`, `aide`, `accueil`, `suivant`, etc.

## Architecture

```
Application mobile (Frontend/, Expo)
        │  HTTP / JSON
        ▼
API Node.js / Express (backend/, port 5001) ──▶ OpenAI (GPT, Whisper) · ElevenLabs (TTS)
        │                         │
        │ HTTP                    │ Sequelize
        ▼                         ▼
Service de recommandation ──▶ MySQL (abajimdb)
(recommendation_service/, Flask, port 8000)
```

| Composant | Technologies |
|-----------|--------------|
| Application mobile | React Native 0.79, Expo SDK 53, React Navigation 7, Redux Toolkit, AsyncStorage, expo-av |
| API backend | Node.js, Express 4, Sequelize 6 (MySQL), JWT, Multer, FFmpeg, Winston |
| IA | OpenAI GPT-4o-mini (intentions, réponses), Whisper (speech-to-text), ElevenLabs (text-to-speech) |
| Recommandation | Python 3, Flask, SQLAlchemy, PyMySQL, pandas, NumPy, scikit-learn |

## Structure du projet

```
.
├── Frontend/                      # Application mobile Expo
│   ├── App.js
│   ├── app.json                   # Configuration Expo (dont BASE_URL de l'API)
│   └── src/
│       ├── components/            # Bulle de chat, messages vocaux, cartes de navigation/recommandation
│       ├── context/               # Audio, bulle de chat, historique par enfant
│       ├── navigation/            # Navigateurs
│       ├── reducers/              # Store Redux
│       ├── screens/               # Écrans de l'application
│       ├── services/  utils/      # Appels API, stockage, permissions, audio
├── backend/                       # API Node.js
│   ├── index.js                   # Point d'entrée
│   ├── migrations/                # Migrations SQL / Sequelize des tables du chatbot
│   └── public/src/
│       ├── app.js                 # Déclaration des routes Express
│       ├── controllers/  routes/  # Endpoints REST (chatbot, whisper, recommandations, …)
│       ├── models/                # Modèles Sequelize
│       └── services/              # Intentions, entités, TTS, Whisper, navigation, recommandations
├── recommendation_service/        # Microservice Flask de recommandation
│   ├── app.py
│   ├── teachers/  courses/  exercises/   # Un moteur de recommandation par type de contenu
│   ├── common/  models/  utils/
│   └── requirements.txt
├── run_recommendation_service.py
└── start_recommendation_service.sh
```

## Installation

### Prérequis

- Node.js 18+ et npm
- Python 3.8+ et pip
- MySQL / MariaDB (par exemple via XAMPP) avec une base `abajimdb`
- FFmpeg (utilisé pour analyser les fichiers audio)
- Expo Go sur un téléphone, ou un émulateur Android / iOS
- Clés API OpenAI et ElevenLabs

### 1. Base de données

Créez la base `abajimdb` dans MySQL. Au démarrage, le backend crée avec Sequelize les tables manquantes à partir des modèles. Les scripts de `backend/migrations/` complètent les tables propres au chatbot.

### 2. Backend (API Node.js)

```bash
cd backend
cp .env.example .env      # puis renseigner les clés et accès MySQL
npm install
npm run dev               # ou: npm start
```

L'API écoute sur `http://localhost:5001` (variable `PORT`).

### 3. Service de recommandation (Python)

À la racine du projet :

```bash
cp .env.example .env      # accès MySQL pour le service Python
pip install -r recommendation_service/requirements.txt
python3 run_recommendation_service.py      # ou: ./start_recommendation_service.sh
```

Le service écoute sur `http://localhost:8000`. Il doit correspondre à `RECOMMENDATION_API_URL` dans `backend/.env`.

### 4. Application mobile

```bash
cd Frontend
npm install
npx expo start
```

Renseignez l'URL de l'API dans `Frontend/app.json`, au champ `expo.extra.BASE_URL` (par exemple `http://<IP-locale>:5001/api`, ou une URL ngrok pour tester sur un téléphone).

## Variables d'environnement

`backend/.env` (voir `backend/.env.example`) :

| Variable | Rôle |
|----------|------|
| `PORT`, `NODE_ENV` | Port et mode du serveur |
| `BASE_URL` | URL publique du backend, utilisée pour construire les URLs des fichiers audio |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_CONNECTION` | Connexion MySQL |
| `JWT_SECRET` | Secret de signature des tokens (obligatoire en production) |
| `OPENAI_API_KEY` | GPT (intentions, réponses) et Whisper (transcription) |
| `ELEVENLABS_API_KEY` | Synthèse vocale |
| `RECOMMENDATION_API_URL` | URL du service Python (par défaut `http://localhost:8000/api`) |
| `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | TTS de secours (optionnel) |

`.env` à la racine (voir `.env.example`) : `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_PORT` pour le service de recommandation.

## API principale

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/chatbot/ask` | Envoie un message (texte ou transcription) et reçoit la réponse du chatbot : texte, audio, cartes de navigation |
| `POST` | `/api/chatbot/generate-audio` | Génère l'audio d'un texte |
| `POST` | `/api/whisper/transcribe` | Transcrit un fichier audio (`multipart`, champ `audio`) |
| `GET` | `/api/recommendations/teachers` | Professeurs recommandés |
| `GET` | `/api/recommendations/courses` | Cours recommandés |
| `GET` | `/api/recommendations/exercises` | Exercices recommandés |
| `GET` | `/api/recommendations/health` | État du service de recommandation |

Le backend expose aussi les routes de l'application Abajim (`/api/users`, `/api/enfants`, `/api/manuels`, `/api/webinars`, `/api/meetings`, `/api/quizzes`, `/api/notifications`, …). Le détail du service Python est décrit dans [`recommendation_service/README.md`](recommendation_service/README.md).

## Recommandation de professeurs : principe

1. Sélection des professeurs actifs dans la matière et le niveau demandés (webinaires ou vidéos liées à un manuel).
2. Collecte des interactions élève ↔ professeur, pondérées : abonnement (follow), like, vue de vidéo.
3. Construction d'une matrice *enfant × professeur*, puis calcul de similarité entre enfants (corrélation de Pearson).
4. Score collaboratif : notes des enfants les plus proches, pondérées par leur similarité.
5. Démarrage à froid : sans historique exploitable, classement par popularité globale (abonnés, likes, vues).

## Scripts utiles (backend)

| Commande | Effet |
|----------|-------|
| `npm run dev` | Démarre l'API avec nodemon |
| `npm run cleanup` | Nettoie les anciens fichiers audio générés |
| `npm run setup-audio` | Recrée le fichier audio de secours puis nettoie le cache |
| `./restart-clean.sh` | Arrête les processus Node, nettoie l'audio et relance proprement |
