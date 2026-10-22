// controllers/chatbotController.js
const { getOpenAIResponse } = require('../services/openaiService');
const { getHistory } = require('../services/chatMemory');
const { detectIntent } = require('../services/intentService');
const { extractEntities } = require('../services/entityExtractor');
const { findBestTeacherName } = require('../services/teacherFinder');
const ChatbotMobileService = require('../services/ChatbotMobileService');
const { textToSpeech } = require('../services/ttsService');

const db = require('../models');

/**
 * Fonction utilitaire pour nettoyer les URLs audio
 * Évite la duplication de paramètres et assure des URLs complètes
 */
function cleanAudioUrl(ttsPath) {
  if (!ttsPath) return null;

  // Si l'URL est déjà complète (contient http), la retourner telle quelle
  if (ttsPath.startsWith('http')) {
    return ttsPath;
  }

  // Si l'URL contient déjà des paramètres, ajouter juste le domaine
  if (ttsPath.includes('?') || ttsPath.includes('&')) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
    return ttsPath.startsWith('/') ? `${baseUrl}${ttsPath}` : `${baseUrl}/${ttsPath}`;
  }

  // Sinon, créer une URL complète avec paramètres
  const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
  const cleanPath = ttsPath.startsWith('/uploads/') ? ttsPath : `/uploads/${ttsPath}`;
  return `${baseUrl}${cleanPath}?gender=female&v=${Date.now()}`;
}



const askOpenAI = async (req, res) => {
  const { message, userId, audioPath, messageType, audioDuration, audioSize } = req.body;

  console.log('🎵 Données reçues dans ChatbotController:', {
    message,
    userId,
    audioPath,
    messageType,
    audioDuration,
    audioSize
  });

  if (!message || !userId) {
    return res.status(400).json({ error: 'Message ou userId manquant' });
  }

  // 🎯 Traitement spécial pour les messages de bienvenue
  if (messageType === 'welcome') {
    try {
      console.log('👋 Génération du message de bienvenue dynamique intelligent...');

      // Récupérer les informations de l'utilisateur
      const user = await db.User.findByPk(userId);
      const userName = user?.full_name || 'صديقي';
      const userLevel = user?.level_id || 'غير محدد';

      // Récupérer l'historique récent des conversations (dernières 24h)
      const recentHistory = await db.ChatbotInteraction.findAll({
        where: {
          user_id: userId,
          created_at: {
            [db.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
          }
        },
        order: [['created_at', 'DESC']],
        limit: 5
      });

      // Récupérer les notifications non lues (si la table existe)
      let unreadNotifications = [];
      try {
        // Vérifier si la table notifications existe
        const notificationsExist = await db.sequelize.query(
          "SHOW TABLES LIKE 'notifications'",
          { type: db.Sequelize.QueryTypes.SELECT }
        );

        if (notificationsExist.length > 0) {
          // Récupérer les notifications non lues (seen_at = 0)
          unreadNotifications = await db.sequelize.query(
            `SELECT n.* FROM notifications n
             INNER JOIN notifications_status ns ON n.id = ns.notification_id
             WHERE n.user_id = :userId
             AND ns.user_id = :userId
             AND ns.seen_at = 0
             ORDER BY n.created_at DESC
             LIMIT 3`,
            {
              replacements: { userId },
              type: db.Sequelize.QueryTypes.SELECT
            }
          );
        }
      } catch (notifError) {
        console.log('ℹ️ Table notifications non trouvée ou erreur:', notifError.message);
      }

      // Déterminer le moment de la journée
      const currentHour = new Date().getHours();
      let timeGreeting = 'أهلاً بك';
      if (currentHour < 12) {
        timeGreeting = 'صباح الخير';
      } else if (currentHour < 17) {
        timeGreeting = 'مساء الخير';
      } else {
        timeGreeting = 'مساء الخير';
      }

      // Construire le contexte pour le prompt
      let historyContext = '';
      if (recentHistory.length > 0) {
        const lastInteraction = recentHistory[0];
        const timeSinceLastInteraction = Math.floor((Date.now() - new Date(lastInteraction.created_at)) / (1000 * 60 * 60));

        if (timeSinceLastInteraction < 24) {
          historyContext = `
# سياق المحادثة السابقة:
- آخر محادثة كانت منذ ${timeSinceLastInteraction} ساعة
- آخر موضوع تم مناقشته: ${lastInteraction.matiere || 'غير محدد'}
- آخر مستوى تعليمي: ${lastInteraction.niveau || userLevel}
- عدد المحادثات الأخيرة: ${recentHistory.length}`;
        }
      }

      let notificationContext = '';
      if (unreadNotifications.length > 0) {
        notificationContext = `
# إشعارات جديدة (${unreadNotifications.length}):
${unreadNotifications.map(notif => `- ${notif.title || notif.message}`).join('\n')}`;

        // Marquer les notifications comme lues après les avoir incluses dans le contexte
        try {
          const notificationIds = unreadNotifications.map(notif => notif.id);
          await db.sequelize.query(
            `UPDATE notifications_status
             SET seen_at = :timestamp
             WHERE user_id = :userId
             AND notification_id IN (:notificationIds)`,
            {
              replacements: {
                userId,
                timestamp: Math.floor(Date.now() / 1000),
                notificationIds
              },
              type: db.Sequelize.QueryTypes.UPDATE
            }
          );
          console.log(`✅ ${notificationIds.length} notifications marquées comme lues`);
        } catch (markError) {
          console.error('❌ Erreur marquage notifications:', markError.message);
        }
      }

      // Créer un prompt intelligent pour le message de bienvenue
      const welcomePrompt = `
مهمتك هي إنشاء رسالة ترحيب ذكية وشخصية لطفل يستخدم منصة أبجيم التعليمية.

# معلومات الطفل:
- الاسم: ${userName}
- المستوى الدراسي: ${userLevel}
- الوقت الحالي: ${timeGreeting}

${historyContext}

${notificationContext}

# التعليمات:
- ابدأ بتحية مناسبة للوقت الحالي
- استخدم اسم الطفل إذا كان متوفراً
- إذا كان هناك تاريخ محادثات سابقة، اشر إليها بطريقة لطيفة
- إذا كانت هناك إشعارات جديدة، اذكرها بطريقة مشوقة
- اذكر أنك مساعد أبجيم الذكي
- ادع الطفل لطرح أسئلته التعليمية
- استخدم نبرة دافئة ومشجعة ومناسبة للأطفال
- اجعل الرسالة قصيرة (3-5 جمل) ومشوقة
- استخدم الرموز التعبيرية بشكل مناسب

ابدأ الآن بكتابة رسالة الترحيب الذكية.
`;

      // Créer l'interaction pour le message de bienvenue
      const interaction = await db.ChatbotInteraction.create({
        user_id: userId,
        message: 'رسالة ترحيب ذكية', // Message plus court pour éviter les erreurs
        message_type: 'text', // Utiliser 'text' temporairement pour éviter le problème de cache Sequelize
        intent: 'welcome',
        created_at: new Date()
      });

      // Générer la réponse via OpenAI
      const reply = await getOpenAIResponse(userId, welcomePrompt, [], {
        intent: 'welcome',
        messageType: 'welcome'
      });

      // Générer l'audio TTS
      const ttsPath = await textToSpeech(reply);
      console.log('🎵 TTS Path reçu:', ttsPath);

      const fullTtsPath = cleanAudioUrl(ttsPath);

      console.log('🔊 Message de bienvenue intelligent généré avec audio:', fullTtsPath);

      // Mettre à jour l'interaction avec la réponse et l'audio
      await interaction.update({ response: reply, tts: fullTtsPath });

      return res.json({
        reply,
        audio: fullTtsPath,
        messageType: 'welcome'
      });

    } catch (error) {
      console.error('❌ Erreur génération message de bienvenue:', error);
      // Fallback vers un message statique avec audio
      try {
        const fallbackMessage = `${timeGreeting || 'أهلاً بك'} ${userName || ''}! 👋 أنا مساعد أبجيم الذكي، كيف يمكنني مساعدتك اليوم؟`;
        const ttsPath = await textToSpeech(fallbackMessage);
        console.log('🎵 Fallback TTS Path reçu:', ttsPath);

        const fullTtsPath = cleanAudioUrl(ttsPath);

        return res.json({
          reply: fallbackMessage,
          audio: fullTtsPath,
          messageType: 'welcome'
        });
      } catch (fallbackError) {
        console.error('❌ Erreur fallback TTS:', fallbackError);
        return res.json({
          reply: '👋 أهلاً بك! أنا مساعد أبجيم الذكي، كيف يمكنني مساعدتك؟',
          messageType: 'welcome'
        });
      }
    }
  }

  try {
    let history = [];
    let lastValidMessage = {};

    // 🔄 Récupérer l'historique AVANT de créer la nouvelle interaction
    // pour s'assurer d'inclure l'interaction précédente dans le contexte
    try {
      const { history: rawHistory, lastValidMessage: lastMsg } = await getHistory(userId);
      history = [...rawHistory, { role: 'user', content: message }];
      lastValidMessage = lastMsg || {};
      console.log("📤 lastValidMessage détecté :", lastValidMessage);
      console.log("📤 Historique complet (avec message) :", history);
    } catch (err) {
      console.warn("⚠️ Historique introuvable ou invalide :", err.message);
    }

    let intent;
    try {
      const rawIntent = await detectIntent(message, history);
      intent = rawIntent.replace('نية:', '').trim().replace(/"/g, '') || 'autre';
      console.log('🎯 Intention détectée :', intent);

      // Vérifier si c'est une demande de recommandation suivante
      const isNextRequest = /suivant|autre|التالي|آخر|أخرى|غيره|غيرها/i.test(message);

      // Si c'est une demande de recommandation suivante et que l'intention est "voir_exercices",
      // on la redirige vers "recommander_exercice"
      if (isNextRequest && intent === "voir_exercices") {
        // Vérifier s'il existe une session de recommandation active pour cet utilisateur
        const activeSession = await db.ChatbotRecommendation.findOne({
          where: {
            user_id: userId,
            recommendation_type: 'exercise'
          },
          order: [['created_at', 'DESC']]
        });

        if (activeSession) {
          console.log("🔄 Redirection de voir_exercices vers recommander_exercice (demande suivante)");
          intent = "recommander_exercice";
        }
      }
    } catch (err) {
      console.error('❌ Erreur détection intention :', err.message);
      intent = 'autre';
    }
    const { getManuelsEtMatieres } = require('../services/entityExtractor'); // ou autre emplacement

    const { manuels, matieres } = await getManuelsEtMatieres();

    let entities = await extractEntities(message, history.history, manuels, matieres);

    // 🧹 Nettoyer les entités : convertir les chaînes 'null' en vraies valeurs null
    Object.keys(entities).forEach(key => {
      if (entities[key] === 'null' || entities[key] === 'undefined') {
        entities[key] = null;
      }
      // Nettoyer aussi extractedDirectly si présent
      if (entities.extractedDirectly && typeof entities.extractedDirectly === 'object') {
        Object.keys(entities.extractedDirectly).forEach(subKey => {
          if (entities.extractedDirectly[subKey] === 'null' || entities.extractedDirectly[subKey] === 'undefined') {
            entities.extractedDirectly[subKey] = null;
          }
        });
      }
    });

    // 🔍 Vérifier si la matière a changé pour éviter la persistance incorrecte des entités
    // Une matière a changé si : nouvelle matière non-null ET différente de l'ancienne
    const matiereChanged = entities.matiere && entities.matiere !== null &&
                          lastValidMessage?.matiere && lastValidMessage.matiere !== null &&
                          entities.matiere !== lastValidMessage.matiere;

    // Si la matière a changé, ne pas récupérer les entités liées au professeur de l'historique
    if (matiereChanged) {
        console.log(`🔄 Matière changée de "${lastValidMessage?.matiere}" vers "${entities.matiere}" - Reset des entités professeur`);
        entities.niveau = entities.niveau || lastValidMessage?.niveau;
        entities.manuelName = entities.manuelName || null; // Reset manuel
        entities.page = entities.page || null; // Reset page
        entities.teacherFirstName = entities.teacherFirstName || null; // Reset professeur
        entities.teacherLastName = entities.teacherLastName || null; // Reset professeur
    } else {
        // Comportement normal : récupérer de l'historique si pas de changement de matière
        entities.niveau = entities.niveau || lastValidMessage?.niveau;
        entities.matiere = entities.matiere || lastValidMessage?.matiere;
        entities.manuelName = entities.manuelName || lastValidMessage?.manuelName;
        entities.page = entities.page || lastValidMessage?.page;
        entities.teacherFirstName = entities.teacherFirstName || lastValidMessage?.teacherFirstName;
        entities.teacherLastName = entities.teacherLastName || lastValidMessage?.teacherLastName;
    }
    // ⚠️ Validation manuelle pour éviter hallucinations de matière/niveau/livre
    const extractedDirectly = entities.extractedDirectly || {}; // suppose que extractEntities puisse retourner ça




    if (!entities.level_id) {
      if (entities.niveau && !isNaN(entities.niveau)) {
        entities.level_id = parseInt(entities.niveau);
      } else {
        const user = await db.User.findByPk(userId);
        if (user && user.level_id) {
          entities.level_id = user.level_id;
          entities.niveau = user.level_id.toString();
        }
      }
    }
    console.log('🧩 Entités finales utilisées :', entities);

    console.log('🎵 Création de l\'interaction avec les données:', {
      user_id: userId,
      message,
      message_type: messageType || 'text',
      audio_path: audioPath || null,
      audio_duration: audioDuration || null,
      audio_size: audioSize || null,
      intent
    });

    const interaction = await db.ChatbotInteraction.create({
      user_id: userId,
      message,
      message_type: messageType || 'text', // Utiliser le type fourni ou 'text' par défaut
      audio_path: audioPath || null, // Ajouter le chemin audio si fourni
      audio_duration: audioDuration || null, // Ajouter la durée audio si fournie
      audio_size: audioSize || null, // Ajouter la taille audio si fournie
      intent,
      matiere: entities.matiere || null,
      niveau: entities.niveau || null,
      manuelName: entities.manuelName || null,
      page: entities.page || null,
      teacherFirstName: entities.teacherFirstName || null,
      teacherLastName: entities.teacherLastName || null,
      created_at: new Date()
    });

    console.log('🎵 Interaction créée avec ID:', interaction.id);

    let chatbotResponse = null;

    // 🎯 Traitement spécial pour l'intention d'accueil (inclure les notifications)
    if (intent === "accueil") {
      try {
        console.log('👋 Traitement de l\'intention d\'accueil avec notifications...');

        // Récupérer les informations de l'utilisateur
        const user = await db.User.findByPk(userId);
        const userName = user?.full_name || 'صديقي';
        const userLevel = user?.level_id || 'غير محدد';

        // Récupérer les notifications non lues
        let unreadNotifications = [];
        try {
          const notificationsExist = await db.sequelize.query(
            "SHOW TABLES LIKE 'notifications'",
            { type: db.Sequelize.QueryTypes.SELECT }
          );

          if (notificationsExist.length > 0) {
            unreadNotifications = await db.sequelize.query(
              `SELECT n.* FROM notifications n
               INNER JOIN notifications_status ns ON n.id = ns.notification_id
               WHERE n.user_id = :userId
               AND ns.user_id = :userId
               AND ns.seen_at = 0
               ORDER BY n.created_at DESC
               LIMIT 3`,
              {
                replacements: { userId },
                type: db.Sequelize.QueryTypes.SELECT
              }
            );
            console.log(`📢 Notifications non lues trouvées: ${unreadNotifications.length}`);
          }
        } catch (notifError) {
          console.log('ℹ️ Erreur récupération notifications:', notifError.message);
        }

        // Construire le contexte avec notifications
        let notificationContext = '';
        if (unreadNotifications.length > 0) {
          notificationContext = `
# إشعارات جديدة (${unreadNotifications.length}):
${unreadNotifications.map(notif => `- ${notif.title || notif.message}`).join('\n')}`;

          // Marquer les notifications comme lues
          try {
            const notificationIds = unreadNotifications.map(notif => notif.id);
            await db.sequelize.query(
              `UPDATE notifications_status
               SET seen_at = :timestamp
               WHERE user_id = :userId
               AND notification_id IN (:notificationIds)`,
              {
                replacements: {
                  userId,
                  timestamp: Math.floor(Date.now() / 1000),
                  notificationIds
                },
                type: db.Sequelize.QueryTypes.UPDATE
              }
            );
            console.log(`✅ ${notificationIds.length} notifications marquées comme lues`);
          } catch (markError) {
            console.error('❌ Erreur marquage notifications:', markError.message);
          }
        }

        // Créer un prompt d'accueil avec notifications
        const welcomePrompt = `
مهمتك هي إنشاء رسالة ترحيب دافئة ومشجعة لطفل يستخدم منصة أبجيم التعليمية.

# معلومات الطفل:
- الاسم: ${userName}
- المستوى الدراسي: ${userLevel}

${notificationContext}

# التعليمات:
- ابدأ بتحية دافئة ومناسبة
- استخدم اسم الطفل إذا كان متوفراً
- إذا كانت هناك إشعارات جديدة، اذكرها بطريقة مشوقة ومحفزة
- اذكر أنك مساعد أبجيم الذكي
- ادع الطفل لطرح أسئلته التعليمية
- استخدم نبرة دافئة ومشجعة ومناسبة للأطفال
- اجعل الرسالة قصيرة (3-4 جمل) ومشوقة
- استخدم الرموز التعبيرية بشكل مناسب

ابدأ الآن بكتابة رسالة الترحيب.
`;

        const reply = await getOpenAIResponse(userId, welcomePrompt, history, {
          intent: 'accueil',
          notificationsCount: unreadNotifications.length
        });

        const ttsPath = await textToSpeech(reply);
        const fullTtsPath = cleanAudioUrl(ttsPath);

        await interaction.update({ response: reply, tts: fullTtsPath });

        return res.json({
          reply,
          audio: fullTtsPath,
          notificationsDisplayed: unreadNotifications.length
        });

      } catch (error) {
        console.error('❌ Erreur traitement accueil avec notifications:', error);
        // Fallback vers traitement normal
      }
    }

    if (intent === "abonnement_prof") {
      if (!entities.teacherFirstName && !entities.teacherLastName) {
        return res.json({ reply: "❌ لم أتمكن من استخراج اسم الأستاذ(ة) المطلوب(ة) من رسالتك. حاول كتابة اسمه كاملاً." });
      }

      const allTeachers = await db.User.findAll({
        where: { role_id: 4 },
        attributes: ['id', 'full_name']
      });

      const chosenFullName = await findBestTeacherName(
        entities.teacherFirstName,
        entities.teacherLastName,
        allTeachers
      );

      if (!chosenFullName) {
        return res.json({ reply: "❌ لم أتمكن من التعرف على الأستاذ(ة) المطلوب(ة)." });
      }

      const bestMatch = allTeachers.find(teacher => teacher.full_name === chosenFullName);

      if (!bestMatch) {
        return res.json({ reply: "❌ لم أتمكن من العثور على الأستاذ(ة) المطلوب(ة) في قاعدة البيانات." });
      }

      const child = await db.User.findByPk(userId);

      if (!child || child.role_id !== 8) {
        return res.json({ reply: "❌ هذا الحساب غير مصرح له بالإشتراك في الأساتذة." });
      }

      // Effectuer l'abonnement (follower = enfant, user_id = professeur)
      const result = await ChatbotMobileService.abonnement_prof(child.id, bestMatch.id);

      let subscriptionMessage = "";
      if (result?.message === "Déjà abonné à cet enseignant") {
        subscriptionMessage = "📌 أنت مشترك بالفعل في هذا الأستاذ(ة).";
      } else if (result?.error) {
        return res.json({ reply: `❌ لم يتم الاشتراك: ${result.error}` });
      } else {
        subscriptionMessage = "✅ تم الاشتراك بنجاح!";
      }

      console.log("🎯 Professeur ID pour abonnement :", bestMatch.id);

      // Récupérer le profil complet du professeur
      const teacher = await ChatbotMobileService.voir_profil_prof(bestMatch.id);

      if (!teacher) {
        return res.json({ reply: "❌ تم الاشتراك ولكن لم أتمكن من تحميل ملف الأستاذ(ة)." });
      }

      // Générer une réponse GPT enrichie avec les détails du professeur ET la confirmation d'abonnement
      const teacherPrompt = `🎯 معلومات الأستاذ(ة) والاشتراك:

📝 الاسم: ${teacher.full_name}
📚 المادة الرئيسية: ${teacher.mainSubject}
🎓 عدد الدورات: ${teacher.webinarCount} دورة
📝 عدد التمارين: ${teacher.exerciseCount} تمرين
${teacher.bio ? `\n💬 نبذة: ${teacher.bio}` : ''}

${subscriptionMessage}

اكتب رداً محفزاً ومناسباً للأطفال يتضمن:
1. ترحيب بالطفل
2. تأكيد حالة الاشتراك (جديد أو موجود مسبقاً)
3. ذكر المادة التي يدرسها الأستاذ(ة)
4. ذكر عدد الدورات والتمارين المتاحة
5. دعوة لاستكشاف ملفه الشخصي
6. جملة ختامية محفزة

استخدم اللغة العربية الفصحى المبسطة والمناسبة للأطفال.`;

      const reply = await getOpenAIResponse(userId, teacherPrompt, history, {
        intent,
        teacherId: teacher.id,
        teacherName: teacher.full_name,
        teacherSubject: teacher.mainSubject,
        webinarCount: teacher.webinarCount,
        exerciseCount: teacher.exerciseCount,
        subscriptionStatus: subscriptionMessage
      });

      // Préparer les données pour la navigation automatique
      const navigationData = {
        action: 'NAVIGATE_TO_TEACHER_PROFILE',
        teacherData: {
          id: teacher.id,
          full_name: teacher.full_name,
          avatar: teacher.avatar,
          bio: teacher.bio,
          mainSubject: teacher.mainSubject,
          webinarCount: teacher.webinarCount,
          exerciseCount: teacher.exerciseCount
        },
        autoNavigate: true
      };

      // Générer l'audio TTS pour la réponse
      const ttsPath = await textToSpeech(reply);
      const fullTtsPath = cleanAudioUrl(ttsPath);
      console.log('🔊 Chemin audio complet pour frontend:', fullTtsPath);

      await interaction.update({ response: reply, tts: fullTtsPath });

      return res.json({
        reply,
        audio: fullTtsPath,
        navigation: navigationData,
        teacherProfile: teacher,
        subscriptionResult: result
      });

    } else if (intent === "voir_exercice") {
      // Nouvelle intention pour navigation vers un exercice spécifique
      const user = await db.User.findByPk(userId);
      const levelId = entities.level_id || user?.level_id;

      if (!levelId) {
        return res.json({
          reply: "❌ لم أتمكن من تحديد المستوى الدراسي للبحث عن التمرين."
        });
      }

      const chatbotResponse = await ChatbotMobileService.voir_exercice(
        levelId,
        entities.matiere,
        message,
        entities
      );

      if (!chatbotResponse.success) {
        return res.json({
          reply: chatbotResponse.message
        });
      }

      // Générer l'audio TTS pour le message
      const ttsPath = await textToSpeech(chatbotResponse.message);
      const fullTtsPath = cleanAudioUrl(ttsPath);

      // Réponse structurée pour le frontend
      const structuredResponse = {
        reply: chatbotResponse.message,
        action: chatbotResponse.action,
        payload: chatbotResponse.payload,
        audio: fullTtsPath
      };

      await interaction.update({ response: JSON.stringify(structuredResponse), tts: fullTtsPath });
      return res.json(structuredResponse);

    } else if (intent === "voir_exercices") {
      if (!entities.matiere) {
        return res.json({
          reply: `❌ لم أتمكن من معرفة المادة التي تريد التمارين منها. من فضلك، أخبرني: عن أي مادة تبحث؟`
        });
      } else {
        // Utiliser le nouveau service de navigation intelligente avec filtrage par page
        const ExerciseNavigationService = require('../services/ExerciseNavigationService');

        // Récupérer les IDs des matières pour ce niveau et cette matière
        const materials = await db.Material.findAll({
          where: {
            name: {
              [db.Sequelize.Op.like]: `%${entities.matiere}%`
            }
          },
          attributes: ['id', 'name']
        });

        const matiereIds = materials.map(m => m.id);
        console.log(`🎯 Matières trouvées pour "${entities.matiere}": [${matiereIds.join(', ')}]`);

        const chatbotResponse = await ExerciseNavigationService.processVoirExercicesIntention(
          entities.level_id,
          entities.matiere,
          message,
          matiereIds
        );

        // Gérer les réponses du nouveau service intelligent
        if (chatbotResponse && typeof chatbotResponse === 'object' && 'success' in chatbotResponse) {
          // Navigation intelligente réussie
          if (chatbotResponse.success) {
            // Cas où un exercice spécifique a été trouvé (navigation directe)
            if (chatbotResponse.navigation && chatbotResponse.navigation.screen === 'ExerciseDetailScreen') {
              const exerciseId = chatbotResponse.navigation.params?.exerciseId;
              const exerciseTitle = chatbotResponse.exerciseData?.title || 'تمرين';

              const prompt = `
مهمتك هي إخبار الطفل أنك وجدت التمرين الذي يبحث عنه وأنك ستوجهه إليه مباشرة.

# معلومات التمرين:
- اسم التمرين: ${exerciseTitle}
- معرف التمرين: ${exerciseId}

# التعليمات:
- تحدث بنبرة مشجعة ومتحمسة.
- أخبره أنك وجدت التمرين المطلوب.
- شجعه على حل التمرين.
- استخدم عبارات إيجابية ومحفزة.

ابدأ الآن.
`;

              const reply = await getOpenAIResponse(userId, prompt, history, {
                intent,
                matiere: entities.matiere,
                niveau: entities.level_id,
                exerciseData: chatbotResponse.exerciseData
              });

              const ttsPath = await textToSpeech(reply);
              const fullTtsPath = cleanAudioUrl(ttsPath);

              await interaction.update({ response: reply, tts: fullTtsPath });
              return res.json({
                reply,
                audio: fullTtsPath,
                navigation: chatbotResponse.navigation,
                exerciseData: chatbotResponse.exerciseData
              });
            }

            // Cas où plusieurs exercices correspondent (liste) - Nouvelle structure
            else if (chatbotResponse.action === 'SHOW_EXERCISES_LIST' && chatbotResponse.payload && chatbotResponse.payload.exercises) {
              console.log('📋 Affichage de la liste d\'exercices avec nouvelle structure');

              // Préparer les informations des exercices pour GPT
              const exercisesList = chatbotResponse.exercisesList || chatbotResponse.payload.exercises;

              // Extraire les informations de page et livre depuis les exercices
              const firstExercise = exercisesList[0];
              const pageNumber = firstExercise?.page;
              const bookName = firstExercise?.manuel || 'كتاب الرياضيات';
              const subjectName = chatbotResponse.matiereName || entities.matiere || 'الرياضيات';

              // Préparer la liste simplifiée des exercices (seulement numéro + professeur)
              const simplifiedExercisesText = exercisesList.map((ex, index) => {
                const teacherName = ex.teacher?.full_name || 'مدرس غير معروف';
                const exerciseNumber = ex.numero || (index + 1);
                return `تمرين ${exerciseNumber} للأستاذ ${teacherName}`;
              }).join('\n');

              // Créer un prompt pour GPT afin de générer une réponse concise
              const prompt = `
مهمتك هي تقديم قائمة التمارين المتاحة للطفل بطريقة مشجعة ومبسطة.

# معلومات السياق:
- رسالة الطفل الأصلية: "${chatbotResponse.userMessage || message}"
- المادة: ${subjectName}
- الصفحة: ${pageNumber || 'غير محددة'}
- الكتاب: ${bookName}
- عدد التمارين الموجودة: ${chatbotResponse.exerciseCount || exercisesList.length}

# قائمة التمارين المبسطة:
${simplifiedExercisesText}

# التعليمات المهمة:
- ابدأ بعبارة تشجيعية قصيرة
- اذكر الصفحة والكتاب مرة واحدة فقط في البداية
- مثال: "وجدت هذه التمارين في الصفحة X من كتاب Y:"
- اعرض قائمة التمارين بشكل مبسط (رقم التمرين + اسم الأستاذ فقط)
- لا تكرر معلومات الصفحة والكتاب لكل تمرين
- انته بجملة "يمكنك اختيار تمرين لمشاهدته"
- استخدم نبرة بسيطة ومناسبة للأطفال
- تجنب الإفراط في الرموز التعبيرية

مثال على الشكل المطلوب:
"وجدت هذه التمارين في الصفحة 7 من كتاب الرياضيات:
تمرين 4 للأستاذ نسرين خواجة
تمرين 5 للأستاذ نسرين خواجة
يمكنك اختيار تمرين لمشاهدته"

ابدأ الآن بصياغة رد مبسط ومحفز.
`;

              // Générer la réponse avec GPT
              const reply = await getOpenAIResponse(userId, prompt, history, {
                intent,
                matiere: entities.matiere,
                niveau: entities.level_id,
                exercisesList: exercisesList
              });

              // Générer l'audio TTS pour la réponse GPT
              const ttsPath = await textToSpeech(reply);
              const fullTtsPath = cleanAudioUrl(ttsPath);

              // Réponse structurée pour le frontend
              const structuredResponse = {
                reply: reply, // Utiliser la réponse GPT au lieu du message statique
                action: chatbotResponse.action,
                payload: chatbotResponse.payload,
                audio: fullTtsPath
              };

              await interaction.update({ response: JSON.stringify(structuredResponse), tts: fullTtsPath });
              return res.json(structuredResponse);
            }

            // Cas où plusieurs exercices correspondent (liste) - Ancienne structure pour rétrocompatibilité
            else if (chatbotResponse.data && chatbotResponse.data.exercises) {
              const exercisesList = chatbotResponse.data.exercises;
              const exercisesText = exercisesList.map((ex, index) =>
                `${index + 1}. ${ex.title}${ex.page ? ` (صفحة ${ex.page})` : ''}${ex.numero ? ` - تمرين رقم ${ex.numero}` : ''}`
              ).join('\n');

              const prompt = `
مهمتك هي عرض قائمة التمارين المتاحة على الطفل بطريقة منظمة ومشجعة.

# قائمة التمارين:
${exercisesText}

# التعليمات:
- قدم القائمة بطريقة منظمة وواضحة.
- شجع الطفل على اختيار التمرين الذي يريده.
- استخدم عبارات إيجابية ومحفزة.
- أخبره أنه يمكنه اختيار أي تمرين من القائمة.

ابدأ الآن.
`;

              const reply = await getOpenAIResponse(userId, prompt, history, {
                intent,
                matiere: entities.matiere,
                niveau: entities.level_id,
                exercisesList: exercisesList
              });

              const ttsPath = await textToSpeech(reply);
              const fullTtsPath = cleanAudioUrl(ttsPath);

              await interaction.update({ response: reply, tts: fullTtsPath });
              return res.json({
                reply,
                audio: fullTtsPath,
                exercisesList: exercisesList,
                data: chatbotResponse.data
              });
            }
          }

          // Navigation intelligente n'a pas trouvé de correspondance
          const reply = await getOpenAIResponse(userId, chatbotResponse.messageAr || chatbotResponse.message, history, {
            intent,
            matiere: entities.matiere,
            niveau: entities.level_id
          });

          const ttsPath = await textToSpeech(reply);
          const fullTtsPath = cleanAudioUrl(ttsPath);

          await interaction.update({ response: reply, tts: fullTtsPath });
          return res.json({ reply, audio: fullTtsPath });
        }

        // Gestion de l'ancien format (rétrocompatibilité)
        else if (Array.isArray(chatbotResponse)) {
          const lignes = chatbotResponse.map(item => {
            if (item.type === "PDF") {
              return `📄 *${item.titre}* \n📘 عدد الصفحات: ${item.pages}\n🔗 [رابط التحميل](${item.lien})`;
            } else {
              return `📹 *${item.titre}*${item.page ? ` (صفحة ${item.page})` : ""}\n🔗 [مشاهدة الفيديو](${item.lien})`;
            }
          }).join("\n\n");

          return res.json({ reply: `📚 إليك التمارين المتوفرة:\n\n${lignes}` });
        } else if (chatbotResponse && chatbotResponse.message) {
          return res.json({ reply: chatbotResponse.message });
        } else {
          return res.json({
            reply: "📭 لم أتمكن من العثور على تمارين أو محتوى لهذا الكتاب."
          });
        }
      }
    } else if (intent === "voir_manuels") {
      const user = await db.User.findByPk(userId);
      const levelId = entities.level_id || user?.level_id;

      if (!levelId) {
        return res.json({
          reply: "❌ لم أتمكن من تحديد المستوى الدراسي. الرجاء تحديده للمساعدة في عرض الكتب المناسبة."
        });
      }

      // 🔍 NOUVEAU : Détecter si une page spécifique est demandée
      if (entities.page && (entities.manuelName || entities.matiere)) {
        console.log(`🔍 Page spécifique demandée - Page: ${entities.page}, Manuel: ${entities.manuelName}, Matière: ${entities.matiere}`);

        try {
          const userMessage = interaction.message || "";
          const result = await ChatbotMobileService.voir_manuel(
            userId,
            userMessage,
            levelId,
            entities
          );

          console.log('📦 Réponse du service voir_manuel:', JSON.stringify(result, null, 2));

          if (result.error) {
            return res.json({
              reply: result.chatbot_response || "عذراً، حدث خطأ أثناء البحث عن الكتاب."
            });
          }

          // Générer l'audio pour la réponse
          const ttsPath = await textToSpeech(result.chatbot_response);
          const fullTtsPath = cleanAudioUrl(ttsPath);

          await interaction.update({
            response: result.chatbot_response,
            tts: fullTtsPath
          });

          return res.json({
            reply: result.chatbot_response,
            audio: fullTtsPath,
            action: result.action,
            payload: result.payload
          });

        } catch (error) {
          console.error('❌ Erreur dans voir_manuel:', error);
          return res.json({
            reply: "عذراً، حدث خطأ أثناء البحث عن الكتاب. يرجى المحاولة مرة أخرى."
          });
        }
      }

      // ❗ Sécurité : nettoyer les entités résiduelles pour les cas normaux
      entities.manuelName = null;

      // 📘 Cas 1 : aucune matière, aucun manuel → afficher tout
      if (!entities.matiere && !entities.manuelName) {
        const manuels = await ChatbotMobileService.voir_manuels(levelId);

        if (!manuels || manuels.length === 0) {
          return res.json({ reply: `📭 لا توجد كتب متاحة حاليًا للمستوى ${levelId}.` });
        }

        const lignes = manuels.map(m =>
          `📘 ${m.name} (${m.material?.name || 'بدون مادة'})`
        ).join("\n");

        const prompt = `📚 إليك قائمة الكتب المتاحة لمستواك:\n\n${lignes}\n\n📌 اختر الكتاب الذي تود تصفحه.`;

        const reply = await getOpenAIResponse(userId, prompt, history, {
          intent,
          niveau: levelId.toString()
        });

        await interaction.update({ response: reply });
        return res.json({ reply });
      }

      // 📗 Cas 2 : matière fournie, pas de manuel → filtrer par matière
      if (entities.matiere && !entities.manuelName) {
        const manuels = await ChatbotMobileService.voir_manuels(levelId);

        const filtrés = manuels.filter(m =>
          m.material?.name?.trim()?.toLowerCase() === entities.matiere?.trim()?.toLowerCase()
        );

        if (!filtrés || filtrés.length === 0) {
          return res.json({
            reply: `❌ لم أجد كتبًا في مادة "${entities.matiere}" للمستوى ${levelId}.`
          });
        }

        const lignes = filtrés.map(m =>
          `📘 ${m.name}`
        ).join("\n");

        const prompt = `📚 الكتب المتوفرة في مادة "${entities.matiere}" هي:\n\n${lignes}\n\n📌 هل تود أن أريك تفاصيل أحدها؟`;

        const reply = await getOpenAIResponse(userId, prompt, history, {
          intent,
          matiere: entities.matiere,
          niveau: levelId.toString()
        });

        await interaction.update({ response: reply });
        return res.json({ reply });
      }

      // ⚠️ Cas mal géré : manuelName seul → ignorer ici
      return res.json({ reply: "📚 الرجاء تحديد اسم المادة أو تركها فارغة لرؤية جميع الكتب." });
    } else if (intent === "voir_details_manuel") {
      const user = await db.User.findByPk(userId);
      const levelId = entities.level_id || user?.level_id;

      if (!levelId) {
        return res.json({
          reply: "❌ لم أتمكن من تحديد المستوى الدراسي لعرض تفاصيل الكتاب."
        });
      }
      const userMessage = interaction.message || "";
      const resultat = await ChatbotMobileService.voir_details_manuel(
        userId,
        userMessage, // 👉 pas manuelName directement
        levelId
      );

      if (resultat.message) {
        return res.json({ reply: resultat.message });
      }

      const prompt = `📖 تفاصيل الكتاب المطلوب:\n\n- العنوان: ${resultat.titre}\n${resultat.couverture}\n\n${resultat.contenu}`;

      const reply = await getOpenAIResponse(userId, prompt, history, {
        intent,
        niveau: levelId.toString(),
        manuelName: resultat.titre // ✅ vrai nom retourné
      });

      await interaction.update({ response: reply });
      return res.json({ reply });
    } else if (intent === "voir_manuel") {
      // Nouvelle intention pour voir une page spécifique d'un manuel
      const user = await db.User.findByPk(userId);
      const levelId = entities.level_id || user?.level_id;

      if (!levelId) {
        return res.json({
          reply: "❌ لم أتمكن من تحديد المستوى الدراسي لعرض الكتاب المطلوب."
        });
      }

      console.log(`🔍 Traitement voir_manuel - Entités:`, entities);

      try {
        const userMessage = interaction.message || "";
        const result = await ChatbotMobileService.voir_manuel(
          userId,
          userMessage,
          levelId,
          entities
        );

        console.log('📦 Réponse du service voir_manuel:', JSON.stringify(result, null, 2));

        if (result.error) {
          return res.json({
            reply: result.chatbot_response || "عذراً، حدث خطأ أثناء البحث عن الكتاب."
          });
        }

        // Générer l'audio pour la réponse
        const ttsPath = await textToSpeech(result.chatbot_response);
        const fullTtsPath = cleanAudioUrl(ttsPath);

        await interaction.update({
          response: result.chatbot_response,
          tts: fullTtsPath
        });

        return res.json({
          reply: result.chatbot_response,
          audio: fullTtsPath,
          action: result.action,
          payload: result.payload
        });

      } catch (error) {
        console.error('❌ Erreur dans voir_manuel:', error);
        return res.json({
          reply: "عذراً، حدث خطأ أثناء البحث عن الكتاب. يرجى المحاولة مرة أخرى."
        });
      }
    } else if (intent === "voir_profil_prof") {
      if (!entities.teacherFirstName && !entities.teacherLastName) {
        return res.json({
          reply: "❌ لم أتمكن من استخراج اسم الأستاذ(ة) المطلوب(ة) من رسالتك. حاول كتابة اسمه كاملاً."
        });
      }

      const allTeachers = await db.User.findAll({
        where: { role_id: 4 },
        attributes: ['id', 'full_name']
      });

      const chosenFullName = await findBestTeacherName(
        entities.teacherFirstName,
        entities.teacherLastName,
        allTeachers
      );

      if (!chosenFullName) {
        return res.json({ reply: "❌ لم أتمكن من التعرف على الأستاذ(ة) المطلوب(ة)." });
      }

      const bestMatch = allTeachers.find(t => t.full_name === chosenFullName);

      if (!bestMatch || !bestMatch.id) {
        return res.json({ reply: "❌ لم أتمكن من العثور على الأستاذ(ة) المطلوب(ة) في قاعدة البيانات." });
      }

      console.log("🎯 Professeur ID à consulter :", bestMatch.id);

      const teacher = await ChatbotMobileService.voir_profil_prof(bestMatch.id);

      if (!teacher) {
        return res.json({ reply: "❌ لم أتمكن من تحميل ملف الأستاذ(ة)." });
      }

      // Générer une réponse GPT enrichie avec les détails du professeur
      const teacherPrompt = `🎯 معلومات الأستاذ(ة) المطلوب(ة):

📝 الاسم: ${teacher.full_name}
📚 المادة الرئيسية: ${teacher.mainSubject}
🎓 عدد الدورات: ${teacher.webinarCount} دورة
📝 عدد التمارين: ${teacher.exerciseCount} تمرين
${teacher.bio ? `\n💬 نبذة: ${teacher.bio}` : ''}

اكتب رداً محفزاً ومناسباً للأطفال يتضمن:
1. ترحيب بالطفل
2. تأكيد وجود الأستاذ(ة) في التطبيق
3. ذكر المادة التي يدرسها
4. ذكر عدد الدورات والتمارين المتاحة
5. دعوة لاستكشاف ملفه الشخصي
6. جملة ختامية محفزة

استخدم اللغة العربية الفصحى المبسطة والمناسبة للأطفال.`;

      const reply = await getOpenAIResponse(userId, teacherPrompt, history, {
        intent,
        teacherId: teacher.id,
        teacherName: teacher.full_name,
        teacherSubject: teacher.mainSubject,
        webinarCount: teacher.webinarCount,
        exerciseCount: teacher.exerciseCount
      });

      // Préparer les données pour la navigation automatique
      const navigationData = {
        action: 'NAVIGATE_TO_TEACHER_PROFILE',
        teacherData: {
          id: teacher.id,
          full_name: teacher.full_name,
          avatar: teacher.avatar,
          bio: teacher.bio,
          mainSubject: teacher.mainSubject,
          webinarCount: teacher.webinarCount,
          exerciseCount: teacher.exerciseCount
        },
        autoNavigate: true
      };

      // Générer l'audio TTS pour la réponse
      const ttsPath = await textToSpeech(reply);
      const fullTtsPath = cleanAudioUrl(ttsPath);
      console.log('🔊 Chemin audio complet pour frontend:', fullTtsPath);

      await interaction.update({ response: reply, tts: fullTtsPath });

      return res.json({
        reply,
        audio: fullTtsPath,
        navigation: navigationData,
        teacherProfile: teacher
      });
    } else if (intent === "abonnement_platforme") {
      // Nouvelle intention pour afficher les offres d'abonnement de la plateforme
      console.log('🔒 Traitement de l\'intention abonnement_platforme pour userId:', userId);

      try {
        const chatbotResponse = await ChatbotMobileService.abonnement_platforme(userId);
        console.log('📦 Réponse du service abonnement_platforme:', JSON.stringify(chatbotResponse, null, 2));

        if (chatbotResponse.error) {
          return res.json({
            reply: chatbotResponse.chatbot_response || "عذراً، حدث خطأ أثناء جلب عروض الاشتراك."
          });
        }

        // Générer l'audio pour la réponse
        const ttsPath = await textToSpeech(chatbotResponse.chatbot_response);
        const fullTtsPath = cleanAudioUrl(ttsPath);

        await interaction.update({
          response: chatbotResponse.chatbot_response,
          tts: fullTtsPath
        });

        return res.json({
          reply: chatbotResponse.chatbot_response,
          audio: fullTtsPath,
          action: chatbotResponse.action,
          payload: chatbotResponse.payload
        });

      } catch (error) {
        console.error('❌ Erreur dans abonnement_platforme:', error);
        return res.json({
          reply: "عذراً، حدث خطأ أثناء جلب عروض الاشتراك. يرجى المحاولة مرة أخرى."
        });
      }
    } else if (intent === "recommander_professeur") {
      const levelId = entities.level_id;
      const matiereName = entities.matiere;

      if (!levelId || !matiereName) {
        return res.json({ reply: "❌ يجب تحديد المستوى والمادة لكي أقترح عليك أستاذًا." });
      }

      // Vérifier si c'est une demande de recommandation suivante
      const isNextRequest = /suivant|autre|التالي|آخر|أخرى|غيره|غيرها/i.test(message);
      console.log(`🔍 Type de demande: ${isNextRequest ? 'Recommandation suivante' : 'Nouvelle recommandation'}`);

      // Récupérer l'historique de conversation
      let conversationHistory;
      try {
        const historyResult = await getHistory(userId);

        // Vérifier si l'historique est au bon format
        if (historyResult && historyResult.history && Array.isArray(historyResult.history)) {
          conversationHistory = historyResult.history;
        } else if (Array.isArray(historyResult)) {
          conversationHistory = historyResult;
        } else {
          // Créer un historique vide si le format n'est pas reconnu
          console.warn("⚠️ Format d'historique non reconnu, création d'un historique vide");
          conversationHistory = [];
        }

        console.log(`📚 Historique récupéré: ${conversationHistory.length} messages`);
      } catch (error) {
        console.error(`❌ Erreur lors de la récupération de l'historique: ${error.message}`);
        conversationHistory = [];
      }

      // Appeler le service avec le message utilisateur et l'historique
      const result = await ChatbotMobileService.recommander_professeur(
        userId,
        matiereName,
        message,
        conversationHistory
      );

      // Si aucun professeur n'est trouvé
      if (!result) {
        return res.json({ reply: "❌ لم أجد أستاذًا مناسبًا لك حاليًا في هذه المادة." });
      }

      // Si plus de recommandations disponibles
      if (result.noMoreRecommendations) {
        const noMoreRecommendationsPrompt = `
مهمتك هي إخبار الطفل بطريقة لطيفة أنه لا توجد المزيد من الأساتذة المتاحين حاليًا.

# التعليمات:
- تحدث بنبرة لطيفة ومتفهمة.
- اقترح عليه أن يجرب أحد الأساتذة الذين تم اقتراحهم سابقًا.
- شجعه على مواصلة التعلم.

ابدأ الآن.
`;

        const reply = await getOpenAIResponse(userId, noMoreRecommendationsPrompt, history, {
          intent,
          matiere: matiereName,
          niveau: levelId
        });

        const ttsPath = await textToSpeech(reply);
        const fullTtsPath = cleanAudioUrl(ttsPath);

        await interaction.update({ response: reply, tts: fullTtsPath });
        return res.json({ reply, audio: fullTtsPath });
      }

      // Traiter le professeur recommandé
      const teacher = result.professeur;
      const currentIndex = result.index;
      const totalRecommendations = result.total;

      // Logs de débogage
      console.log(`[DEBUG] Recommandation ${currentIndex}/${totalRecommendations}`);
      console.log('[DEBUG] Objet teacher reçu:', JSON.stringify(teacher, null, 2));

      // Déterminer le nom du professeur
      const teacherName = teacher.name || teacher.full_name || 'أستاذ(ة)';
      console.log('[DEBUG] Nom du professeur utilisé:', teacherName);

      // Calculer le score en pourcentage
      const scorePercentage = Math.round((teacher.score || 0) * 20);

      // Déterminer le niveau d'expertise basé sur le score
      let expertiseLevel = 'مبتدئ';
      if (scorePercentage > 80) expertiseLevel = 'خبير';
      else if (scorePercentage > 60) expertiseLevel = 'متقدم';
      else if (scorePercentage > 40) expertiseLevel = 'متوسط';

      // Déterminer les points forts
      const strengths = [];
      if (teacher.content_score && teacher.content_score > 2) strengths.push('محتوى تعليمي غني');
      if (teacher.popularity_score && teacher.popularity_score > 2) strengths.push('شعبية كبيرة بين الطلاب');
      if (teacher.interaction_score && teacher.interaction_score > 2) strengths.push('تفاعل ممتاز مع الطلاب');

      const strengthsText = strengths.length > 0
        ? `- نقاط القوة: ${strengths.join('، ')}`
        : '';

      // Ajouter des informations sur la progression des recommandations
      const progressionText = `\n\n# معلومات إضافية:\n- هذا هو الأستاذ رقم ${currentIndex} من أصل ${totalRecommendations} أساتذة موصى بهم.\n- يمكنك طلب أستاذ آخر بقول "أريد أستاذًا آخر" أو "التالي".`;

      // 🤖 Créer un prompt enrichi avec les données de recommandation
      const prompt = `
مهمتك هي تقديم توصية مشوقة وموجهة للطفل حول أستاذ يمكنه مساعدته في تعلم مادة معينة.

# تفاصيل الأستاذ الموصى به:
- الاسم: ${teacherName}
- المستوى الذي يدرّس فيه: ${teacher.level_id || 'غير محدد'}
- مادة التدريس: ${teacher.realMatiere || matiereName || 'غير محددة'}
- نبذة: ${teacher.bio || teacher.about || 'لا توجد نبذة متاحة'}
- الخبرة وعدد الدروس: ${teacher.webinarCount || 0}
- الدروس الأخيرة: ${(teacher.lastCourses || []).join(', ')}
- مستوى الخبرة: ${expertiseLevel} (${scorePercentage}%)
${strengthsText}
${progressionText}

# بيانات الذكاء الاصطناعي للتوصية:
- قائمة الأساتذة الجديدة: ${JSON.stringify(result.newRecommendationList?.slice(0, 3) || [])}
- الأساتذة المعروضون سابقًا: ${JSON.stringify(result.previouslyShownIds || [])}
- معرف الجلسة: ${result.sessionId}

# التعليمات:
- تحدث بنبرة لطيفة ومشجعة.
- شجع الطفل على التعلم مع هذا الأستاذ.
- اشرح له لماذا هذا الأستاذ مناسب له بالتحديد.
- اذكر نقاط القوة الخاصة بالأستاذ.
- استخدم عبارات إيجابية ومحفزة.
- أخبر الطفل أنه يمكنه طلب أستاذ آخر إذا أراد ذلك.
- استخدم بيانات الذكاء الاصطناعي لتقديم توصية أكثر ذكاءً وتخصيصًا.

ابدأ الآن.
`;

      const reply = await getOpenAIResponse(userId, prompt, history, {
        intent,
        matiere: matiereName,
        niveau: levelId,
        recommendationData: result
      });

      const ttsPath = await textToSpeech(reply);
      const fullTtsPath = cleanAudioUrl(ttsPath);
      console.log('🔊 Chemin audio complet pour frontend:', fullTtsPath);

      await interaction.update({ response: reply, tts: fullTtsPath });
      return res.json({
        reply,
        audio: fullTtsPath,
        teacher: teacher,
        index: currentIndex,
        total: totalRecommendations,
        sessionId: result.sessionId,
        // Ajouter les informations nécessaires pour la navigation
        recommendationType: 'teacher',
        teacherId: teacher.id || teacher.teacher_id,
        teacherData: {
          id: teacher.id || teacher.teacher_id,
          name: teacherName,
          bio: teacher.bio || teacher.about || '',
          avatar: teacher.avatar || '',
          webinarCount: teacher.webinarCount || 0,
          score: scorePercentage,
          expertise: expertiseLevel,
          matiere: teacher.realMatiere || matiereName
        }
      });
    } else if (intent === "recommander_exercice") {
      const levelId = entities.level_id;
      const matiereName = entities.matiere;

      if (!levelId || !matiereName) {
        return res.json({ reply: "❌ يجب تحديد المستوى والمادة لكي أقترح عليك تمارين مناسبة." });
      }

      console.log(`🔍 Demande de recommandation d'exercices pour l'utilisateur ${userId}, matière '${matiereName}', niveau ${levelId}`);

      // Récupérer l'historique de conversation récent
      let conversationHistory = [];
      try {
        const recentInteractions = await db.ChatbotInteraction.findAll({
          where: {
            user_id: userId,
            created_at: {
              [Op.gte]: new Date(new Date() - 60 * 60 * 1000) // Interactions des dernières 60 minutes
            }
          },
          order: [['created_at', 'ASC']],
          limit: 10
        });

        conversationHistory = recentInteractions.map(interaction => ({
          role: 'user',
          content: interaction.message
        }));

        if (recentInteractions.length > 0) {
          for (let i = 0; i < recentInteractions.length; i++) {
            if (recentInteractions[i].response) {
              conversationHistory.push({
                role: 'assistant',
                content: recentInteractions[i].response
              });
            }
          }
        }

        console.log(`📚 Historique récupéré: ${conversationHistory.length} messages`);
      } catch (error) {
        console.error(`❌ Erreur lors de la récupération de l'historique: ${error.message}`);
        conversationHistory = [];
      }

      // Vérifier si c'est une demande de recommandation suivante
      const isNextRequest = /suivant|autre|التالي|آخر|أخرى|غيره|غيرها/i.test(message);
      console.log(`🔍 Type de demande: ${isNextRequest ? 'Recommandation suivante' : 'Nouvelle recommandation'}`);

      try {
        // Appeler le service avec le message utilisateur et l'historique
        const result = await ChatbotMobileService.recommander_exercice(
          userId,
          matiereName,
          message,
          conversationHistory
        );

        // Si aucun exercice n'est trouvé
        if (!result) {
          console.warn(`⚠️ Aucun exercice trouvé pour l'utilisateur ${userId} (niveau ${levelId}) dans la matière ${matiereName}`);

          // Message spécifique indiquant qu'aucun exercice n'est disponible pour ce niveau et cette matière
          const noExercisesPrompt = `
مهمتك هي إخبار الطفل بطريقة لطيفة أنه لا توجد تمارين متاحة حاليًا لمستواه في المادة التي طلبها.

# المعلومات:
- المستوى: ${levelId}
- المادة: ${matiereName}

# التعليمات:
- تحدث بنبرة لطيفة ومتفهمة.
- اقترح عليه أن يجرب مادة أخرى أو يعود لاحقًا.
- لا تقدم وعودًا محددة بتوفر التمارين في المستقبل.

ابدأ الآن.
`;

          const reply = await getOpenAIResponse(userId, noExercisesPrompt, history, {
            intent,
            matiere: matiereName,
            niveau: levelId
          });

          const ttsPath = await textToSpeech(reply);
          const fullTtsPath = cleanAudioUrl(ttsPath);
          console.log('🔊 Chemin audio complet pour frontend:', fullTtsPath);

          await interaction.update({ response: reply, tts: fullTtsPath });
          return res.json({ reply, audio: fullTtsPath });
        }

        // Si plus de recommandations disponibles
        if (result.noMoreRecommendations) {
          console.log(`⚠️ Plus de recommandations disponibles pour l'utilisateur ${userId}`);
          const noMoreRecommendationsPrompt = `
مهمتك هي إخبار الطفل بطريقة لطيفة أنه لا توجد المزيد من التمارين المتاحة حاليًا.

# المعلومات:
- المستوى: ${levelId}
- المادة: ${matiereName}

# التعليمات:
- تحدث بنبرة لطيفة ومتفهمة.
- اقترح عليه أن يجرب مادة أخرى أو يعود لاحقًا.
- شجعه على مراجعة التمارين التي تم اقتراحها سابقًا.
- لا تذكر تفاصيل تقنية عن سبب عدم توفر المزيد من التمارين.

ابدأ الآن.
`;

          const reply = await getOpenAIResponse(userId, noMoreRecommendationsPrompt, history, {
            intent,
            matiere: matiereName,
            niveau: levelId
          });

          const ttsPath = await textToSpeech(reply);
          const fullTtsPath = cleanAudioUrl(ttsPath);

          await interaction.update({ response: reply, tts: fullTtsPath });
          return res.json({ reply, audio: fullTtsPath });
        }

        // Récupérer l'exercice et les informations de pagination
        const exercise = result.exercise;
        const currentIndex = result.index;
        const totalRecommendations = result.total;

        console.log(`✅ Recommandation d'exercice ${currentIndex}/${totalRecommendations} pour l'utilisateur ${userId}`);

        // Formater l'exercice pour le prompt
        const exerciseFormatted = `
- عنوان: ${exercise.title || exercise.titre || 'تمرين بدون عنوان'}
- الكتاب: ${exercise.manuel_name || 'غير محدد'}
- الصفحة: ${exercise.page || 'غير محددة'}
- المشاهدات: ${exercise.views || exercise.vues || 0}
- الإعجابات: ${exercise.likes || 0}
- المعلم: ${exercise.teacher_name || 'غير محدد'}
`;

        // 🤖 Créer un prompt enrichi avec les données de recommandation
        const prompt = `
مهمتك هي تقديم توصية مشوقة وموجهة للطفل حول تمرين مناسب لمستواه الدراسي في مادة معينة.

# معلومات عامة:
- المستوى الدراسي للطفل: ${levelId}
- المادة: ${matiereName}
- هذا التمرين هو ${currentIndex} من أصل ${totalRecommendations} تمارين موصى بها

# تفاصيل التمرين الموصى به:
${exerciseFormatted}

# بيانات الذكاء الاصطناعي للتوصية:
- قائمة التمارين الجديدة: ${JSON.stringify(result.newRecommendationList?.slice(0, 3) || [])}
- التمارين المعروضة سابقًا: ${JSON.stringify(result.previouslyShownIds || [])}
- معرف الجلسة: ${result.sessionId}

# التعليمات المهمة:
- تحدث بنبرة لطيفة ومشجعة.
- أكد للطفل أن هذا التمرين مناسب تمامًا لمستواه الدراسي.
- شجع الطفل على حل هذا التمرين.
- اشرح له أهمية هذا التمرين في تحسين مستواه.
- استخدم عبارات إيجابية ومحفزة.
- أخبر الطفل أنه يمكنه طلب تمرين آخر بقول "أريد تمرينًا آخر" أو "التالي".
- استخدم بيانات الذكاء الاصطناعي لتقديم توصية أكثر ذكاءً وتخصيصًا.

# تعليمات مهمة جداً:
- لا تضع أي روابط أو URLs في ردك
- لا تستخدم تنسيق markdown للروابط مثل [نص](رابط)
- سيتم عرض التمرين للطفل في بطاقة تفاعلية منفصلة أسفل رسالتك
- ركز فقط على النص التشجيعي والوصف

ابدأ الآن.
`;

        const reply = await getOpenAIResponse(userId, prompt, history, {
          intent,
          matiere: matiereName,
          niveau: levelId,
          recommendationData: result
        });

        const ttsPath = await textToSpeech(reply);
        const fullTtsPath = cleanAudioUrl(ttsPath);
        console.log('🔊 Chemin audio complet pour frontend:', fullTtsPath);

        await interaction.update({ response: reply, tts: fullTtsPath });
        return res.json({
          reply,
          audio: fullTtsPath,
          exercise: exercise,
          index: currentIndex,
          total: totalRecommendations,
          sessionId: result.sessionId,
          // Ajouter les informations nécessaires pour la navigation
          recommendationType: 'exercise',
          exerciseData: {
            id: exercise.id,
            title: exercise.title || exercise.titre,
            video_url: exercise.video_url || exercise.video,  // ✅ Ajout de l'URL de la vidéo
            thumbnail: exercise.thumbnail || exercise.image,
            duration: exercise.duration,
            page: exercise.page,
            manuel_name: exercise.manuel_name,
            views: exercise.views || exercise.vues || 0,
            likes: exercise.likes || 0,
            teacher_name: exercise.teacher_name,
            teacher: exercise.teacher || null,  // ✅ Ajout des informations complètes du professeur
            difficulty: exercise.difficulty || 'متوسط'
          }
        });
      } catch (error) {
        console.error(`❌ Erreur lors de la recommandation d'exercices: ${error.message}`);
        console.error(error.stack);

        // Message d'erreur générique
        const errorPrompt = `
مهمتك هي إخبار الطفل بطريقة لطيفة أنه حدث خطأ أثناء محاولة العثور على تمارين مناسبة له.

# المعلومات:
- المستوى: ${levelId}
- المادة: ${matiereName}

# التعليمات:
- تحدث بنبرة لطيفة ومتفهمة.
- اقترح عليه أن يحاول مرة أخرى لاحقًا.
- لا تذكر تفاصيل تقنية عن الخطأ.
`;

        const reply = await getOpenAIResponse(userId, errorPrompt, history, {
          intent,
          matiere: matiereName,
          niveau: levelId
        });

        const ttsPath = await textToSpeech(reply);
        const fullTtsPath = cleanAudioUrl(ttsPath);

        await interaction.update({ response: reply, tts: fullTtsPath });
        return res.json({ reply, audio: fullTtsPath });
      }
    } else if (intent === "recommander_cours") {
      const levelId = entities.level_id;
      const matiereName = entities.matiere;

      if (!levelId || !matiereName) {
        return res.json({ reply: "❌ يجب تحديد المستوى والمادة لكي أقترح عليك دروسًا مناسبة." });
      }

      console.log(`🔍 Demande de recommandation de cours pour l'utilisateur ${userId}, matière '${matiereName}', niveau ${levelId}`);

      try {
        // Récupérer l'historique de conversation récent
        let conversationHistory = [];
        try {
          const recentInteractions = await db.ChatbotInteraction.findAll({
            where: {
              user_id: userId,
              created_at: {
                [Op.gte]: new Date(new Date() - 60 * 60 * 1000) // Interactions des dernières 60 minutes
              }
            },
            order: [['created_at', 'ASC']],
            limit: 10
          });

          conversationHistory = recentInteractions.map(interaction => ({
            role: 'user',
            content: interaction.message
          }));

          if (recentInteractions.length > 0) {
            for (let i = 0; i < recentInteractions.length; i++) {
              if (recentInteractions[i].response) {
                conversationHistory.push({
                  role: 'assistant',
                  content: recentInteractions[i].response
                });
              }
            }
          }

          console.log(`📚 Historique récupéré: ${conversationHistory.length} messages`);
        } catch (error) {
          console.error(`❌ Erreur lors de la récupération de l'historique: ${error.message}`);
          conversationHistory = [];
        }

        // Vérifier si c'est une demande de recommandation suivante
        const isNextRequest = /suivant|autre|التالي|آخر|أخرى|غيره|غيرها/i.test(message);
        console.log(`🔍 Type de demande: ${isNextRequest ? 'Recommandation suivante' : 'Nouvelle recommandation'}`);

        // Récupérer les cours recommandés pour le niveau de l'utilisateur
        const result = await ChatbotMobileService.recommander_cours(userId, matiereName, message, conversationHistory, 5, levelId);

        if (!result) {
          console.warn(`⚠️ Aucun cours trouvé pour l'utilisateur ${userId} (niveau ${levelId}) dans la matière ${matiereName}`);

          // Message spécifique indiquant qu'aucun cours n'est disponible pour ce niveau et cette matière
          const noCoursesPrompt = `
مهمتك هي إخبار الطفل بطريقة لطيفة أنه لا توجد دروس متاحة حاليًا لمستواه في المادة التي طلبها.

# المعلومات:
- المستوى: ${levelId}
- المادة: ${matiereName}

# التعليمات:
- تحدث بنبرة لطيفة ومتفهمة.
- اقترح عليه أن يجرب مادة أخرى أو يعود لاحقًا.
- لا تقدم وعودًا محددة بتوفر الدروس في المستقبل.

ابدأ الآن.
`;

          const reply = await getOpenAIResponse(userId, noCoursesPrompt, history, {
            intent,
            matiere: matiereName,
            niveau: levelId
          });

          const ttsPath = await textToSpeech(reply);

          // Assurer que le frontend reçoit un chemin complet qui fonctionne avec NGROK
          const fullTtsPath = cleanAudioUrl(ttsPath);
          console.log('🔊 Chemin audio complet pour frontend:', fullTtsPath);

          await interaction.update({ response: reply, tts: fullTtsPath });
          return res.json({ reply, audio: fullTtsPath });
        }

        // Si plus de recommandations disponibles
        if (result.noMoreRecommendations) {
          console.log(`⚠️ Plus de recommandations disponibles pour l'utilisateur ${userId}`);
          const noMoreRecommendationsPrompt = `
مهمتك هي إخبار الطفل بطريقة لطيفة أنه لا توجد المزيد من الدروس المتاحة حاليًا لمستواه في المادة التي طلبها.

# المعلومات:
- المستوى: ${levelId}
- المادة: ${matiereName}

# التعليمات:
- تحدث بنبرة لطيفة ومتفهمة.
- اقترح عليه أن يجرب مادة أخرى أو يستكشف الدروس التي تم اقتراحها سابقًا.
- شجعه على متابعة تعلمه.

ابدأ الآن.
`;

          const reply = await getOpenAIResponse(userId, noMoreRecommendationsPrompt, history, {
            intent,
            matiere: matiereName,
            niveau: levelId
          });

          const ttsPath = await textToSpeech(reply);
          const fullTtsPath = cleanAudioUrl(ttsPath);

          await interaction.update({ response: reply, tts: fullTtsPath });
          return res.json({ reply, audio: fullTtsPath });
        }

        // Récupérer le cours et les informations de pagination
        const course = result.course;
        const currentIndex = result.index;
        const totalRecommendations = result.total;

        console.log(`✅ Recommandation de cours ${currentIndex}/${totalRecommendations} pour l'utilisateur ${userId}`);

        // Formater le cours pour le prompt
        const courseFormatted = `
# تفاصيل الدرس الموصى به:
- عنوان الدرس: ${course.title || 'درس بدون عنوان'}
- المعلم: ${course.teacher?.name || 'غير محدد'}
- النوع: ${course.type || 'غير محدد'}
- السعر: ${course.price || 0} دينار
${course.matched_with_previous_content ? '- هذا الدرس مرتبط بما تعلمته سابقًا' : ''}

# معلومات إضافية:
- هذا الدرس ${currentIndex} من أصل ${totalRecommendations} دروس موصى بها لك.
`;

        // 🤖 Créer un prompt enrichi avec les données de recommandation
        const prompt = `
مهمتك هي تقديم توصية مشوقة وموجهة للطفل حول درس يمكنه الاستفادة منه في مادة معينة.

${courseFormatted}

# بيانات الذكاء الاصطناعي للتوصية:
- قائمة الدروس الجديدة: ${JSON.stringify(result.newRecommendationList?.slice(0, 3) || [])}
- الدروس المعروضة سابقًا: ${JSON.stringify(result.previouslyShownIds || [])}
- معرف الجلسة: ${result.sessionId}

# التعليمات:
- تحدث بنبرة لطيفة ومشجعة.
- شجع الطفل على متابعة هذا الدرس.
- اشرح له أهمية هذا الدرس في تحسين مستواه.
- استخدم عبارات إيجابية ومحفزة.
- أخبره أنه يمكنه طلب درس آخر بقول "أريد درسًا آخر" أو "التالي".
- استخدم بيانات الذكاء الاصطناعي لتقديم توصية أكثر ذكاءً وتخصيصًا.

ابدأ الآن.
`;

        const reply = await getOpenAIResponse(userId, prompt, history, {
          intent,
          matiere: matiereName,
          niveau: levelId,
          recommendationData: result
        });

        const ttsPath = await textToSpeech(reply);

        // Assurer que le frontend reçoit un chemin complet qui fonctionne avec NGROK
        const fullTtsPath = cleanAudioUrl(ttsPath);
        console.log('🔊 Chemin audio complet pour frontend:', fullTtsPath);

        await interaction.update({ response: reply, tts: fullTtsPath });
        return res.json({
          reply,
          audio: fullTtsPath,
          course: course,
          index: currentIndex,
          total: totalRecommendations,
          sessionId: result.sessionId,
          recommendationType: 'course',
          courseData: course
        });
      } catch (error) {
        console.error(`❌ Erreur lors de la recommandation de cours: ${error.message}`);
        console.error(error.stack);

        // Message d'erreur générique en cas d'échec
        const errorPrompt = `
مهمتك هي إخبار الطفل بطريقة لطيفة أنه حدث خطأ أثناء محاولة العثور على دروس مناسبة له.

# المعلومات:
- المستوى: ${levelId}
- المادة: ${matiereName}

# التعليمات:
- تحدث بنبرة لطيفة ومتفهمة.
- اقترح عليه أن يحاول مرة أخرى لاحقًا.
- لا تذكر تفاصيل تقنية عن الخطأ.
`;

        const reply = await getOpenAIResponse(userId, errorPrompt, history, {
          intent,
          matiere: matiereName,
          niveau: levelId
        });

        const ttsPath = await textToSpeech(reply);
        const fullTtsPath = cleanAudioUrl(ttsPath);

        await interaction.update({ response: reply, tts: fullTtsPath });
        return res.json({ reply, audio: fullTtsPath });
      }
    } else if (intent === "recommander_cours") {
      const levelId = entities.level_id;
      const matiereName = entities.matiere;

      if (!levelId || !matiereName) {
        return res.json({ reply: "❌ يجب تحديد المستوى والمادة لكي أقترح عليك دورة مناسبة." });
      }

      try {
        // Vérifier si c'est une demande de recommandation suivante
        const isNextRequest = /suivant|autre|التالي|آخر|أخرى|غيره|غيرها/i.test(message);
        console.log(`🔍 Type de demande: ${isNextRequest ? 'Recommandation suivante' : 'Nouvelle recommandation'}`);

        // Récupérer l'historique de conversation
        let conversationHistory;
        try {
          const historyResult = await getHistory(userId);

          // Vérifier si l'historique est au bon format
          if (historyResult && historyResult.history && Array.isArray(historyResult.history)) {
            conversationHistory = historyResult.history;
          } else if (Array.isArray(historyResult)) {
            conversationHistory = historyResult;
          } else {
            // Créer un historique vide si le format n'est pas reconnu
            console.warn("⚠️ Format d'historique non reconnu, création d'un historique vide");
            conversationHistory = [];
          }

          console.log(`📚 Historique récupéré: ${conversationHistory.length} messages`);
        } catch (error) {
          console.error(`❌ Erreur lors de la récupération de l'historique: ${error.message}`);
          conversationHistory = [];
        }

        // Appeler le service avec le message utilisateur et l'historique
        const result = await ChatbotMobileService.recommander_cours(
          userId,
          matiereName,
          message,
          conversationHistory
        );

        // Si aucun cours n'est trouvé
        if (!result) {
          return res.json({ reply: "❌ لم أجد دورة مناسبة لك حاليًا في هذه المادة." });
        }

        // Si plus de recommandations disponibles
        if (result.noMoreRecommendations) {
          const noMoreRecommendationsPrompt = `
مهمتك هي إخبار الطفل بطريقة لطيفة أنه لا توجد المزيد من الدورات المتاحة حاليًا.

# المعلومات:
- المستوى: ${levelId}
- المادة: ${matiereName}

# التعليمات:
- تحدث بنبرة لطيفة ومتفهمة.
- اقترح عليه أن يجرب إحدى الدورات التي تم اقتراحها سابقًا.
- شجعه على مواصلة التعلم.

ابدأ الآن.
`;

          const reply = await getOpenAIResponse(userId, noMoreRecommendationsPrompt, history, {
            intent,
            matiere: matiereName,
            niveau: levelId
          });

          const ttsPath = await textToSpeech(reply);
          const fullTtsPath = cleanAudioUrl(ttsPath);

          await interaction.update({ response: reply, tts: fullTtsPath });
          return res.json({ reply, audio: fullTtsPath });
        }

        // Récupérer le cours et les informations de pagination
        const course = result.course;
        const currentIndex = result.index;
        const totalRecommendations = result.total;

        console.log(`✅ Recommandation de cours ${currentIndex}/${totalRecommendations} pour l'utilisateur ${userId}`);

        // Formater le cours pour le prompt
        const courseFormatted = `
# تفاصيل الدرس الموصى به:
- عنوان الدرس: ${course.title || 'درس بدون عنوان'}
- المعلم: ${course.teacher?.full_name || 'غير محدد'}
- النوع: ${course.type || 'غير محدد'}
- السعر: ${course.price || 0} دينار
- المدة: ${course.duration || 'غير محددة'} دقيقة
${course.matched_with_previous_content ? '- هذا الدرس مرتبط بما تعلمته سابقًا' : ''}

# معلومات إضافية:
- هذا الدرس ${currentIndex} من أصل ${totalRecommendations} دروس موصى بها لك.
`;

        // 🤖 Créer un prompt enrichi avec les données de recommandation
        const prompt = `
مهمتك هي تقديم توصية مشوقة وموجهة للطفل حول درس يمكنه الاستفادة منه في مادة معينة.

${courseFormatted}

# بيانات الذكاء الاصطناعي للتوصية:
- قائمة الدروس الجديدة: ${JSON.stringify(result.newRecommendationList?.slice(0, 3) || [])}
- الدروس المعروضة سابقًا: ${JSON.stringify(result.previouslyShownIds || [])}
- معرف الجلسة: ${result.sessionId}

# التعليمات:
- تحدث بنبرة لطيفة ومشجعة.
- شجع الطفل على متابعة هذا الدرس.
- اشرح له أهمية هذا الدرس في تحسين مستواه.
- استخدم عبارات إيجابية ومحفزة.
- أخبره أنه يمكنه طلب درس آخر بقول "أريد درسًا آخر" أو "التالي".
- استخدم بيانات الذكاء الاصطناعي لتقديم توصية أكثر ذكاءً وتخصيصًا.

ابدأ الآن.
`;

        const reply = await getOpenAIResponse(userId, prompt, history, {
          intent,
          matiere: matiereName,
          niveau: levelId,
          recommendationData: result
        });

        const ttsPath = await textToSpeech(reply);

        // Assurer que le frontend reçoit un chemin complet qui fonctionne avec NGROK
        const fullTtsPath = cleanAudioUrl(ttsPath);
        console.log('🔊 Chemin audio complet pour frontend:', fullTtsPath);

        await interaction.update({ response: reply, tts: fullTtsPath });
        return res.json({
          reply,
          audio: fullTtsPath,
          course: course,
          index: currentIndex,
          total: totalRecommendations,
          sessionId: result.sessionId,
          recommendationType: 'course',
          courseData: course
        });
      } catch (error) {
        console.error(`❌ Erreur lors de la recommandation de cours: ${error.message}`);
        console.error(error.stack);

        // Message d'erreur générique en cas d'échec
        const errorPrompt = `
مهمتك هي إخبار الطفل بطريقة لطيفة أنه حدث خطأ أثناء محاولة العثور على دروس مناسبة له.

# المعلومات:
- المستوى: ${levelId}
- المادة: ${matiereName}

# التعليمات:
- تحدث بنبرة لطيفة ومتفهمة.
- اقترح عليه أن يحاول مرة أخرى لاحقًا.
- لا تذكر تفاصيل تقنية عن الخطأ.
`;

        const reply = await getOpenAIResponse(userId, errorPrompt, history, {
          intent,
          matiere: matiereName,
          niveau: levelId
        });

        const ttsPath = await textToSpeech(reply);
        const fullTtsPath = cleanAudioUrl(ttsPath);

        await interaction.update({ response: reply, tts: fullTtsPath });
        return res.json({ reply, audio: fullTtsPath });
      }
    } else if (typeof ChatbotMobileService[intent] === 'function') {
      // Pour l'intention voir_cours, passer également le message utilisateur pour recherche par nom de cours
      if (intent === 'voir_cours') {
        chatbotResponse = await ChatbotMobileService[intent](
          entities.level_id || entities.niveau,
          entities.matiere,
          message  // Passer le message original pour extraction du nom de cours
        );
        console.log('🔍 Réponse reçue de ChatbotMobileService.voir_cours:', JSON.stringify(chatbotResponse, null, 2));
      } else if (intent === 'voir_meets') {
        // Pour l'intention voir_meets, passer le message et les entités pour filtrage
        chatbotResponse = await ChatbotMobileService[intent](
          entities.level_id || entities.niveau,
          message,  // Passer le message original
          entities  // Passer les entités pour filtrage par professeur/matière
        );
        console.log('🔍 Réponse reçue de ChatbotMobileService.voir_meets:', JSON.stringify(chatbotResponse, null, 2));
      } else {
        // Pour les autres intentions, conserver l'appel standard
        chatbotResponse = await ChatbotMobileService[intent](
          entities.level_id || entities.niveau,
          entities.matiere,
          { manuelName: entities.manuelName, page: entities.page }
        );
      }
    } else {
      // Appel intelligent GPT avec mémoire
      const context = {
        intent,
        niveau: entities.niveau,
        matiere: entities.matiere,
        manuelName: entities.manuelName
      };
      chatbotResponse = await ChatbotMobileService.repondreAvecMemoireMix(userId, message, context);
    }

    if (!chatbotResponse) {
      chatbotResponse = { 
        message: "\u2753 \u0644\u0645 \u0623\u0641\u0647\u0645 \u062a\u0645\u0627\u0645\u064b\u0627\u060c \u0647\u0644 \u064a\u0645\u0643\u0646\u0643 \u0625\u0639\u0627\u062f\u0629 \u0635\u064a\u0627\u063a\u0629 \u0633\u0624\u0627\u0644\u0643\u061f",
        success: false,
        navigation: null
      };
    }

    let prompt = message;
    let navigationInfo = null; // Pour stocker les infos de navigation

    // Gérer les réponses spécifiques pour voir_cours
    if (intent === 'voir_cours' && typeof chatbotResponse === 'object' && 'navigation' in chatbotResponse) {
      navigationInfo = chatbotResponse.navigation;

      // Vérifier si la navigation a réussi
      if (chatbotResponse.success) {
        // Cas où un cours spécifique a été trouvé (navigation directe)
        if (chatbotResponse.navigation && chatbotResponse.navigation.screen === 'WebinarDetailScreen') {
          const courseId = chatbotResponse.navigation.params?.webinarId;
          prompt += `

✅ لقد وجدت الدرس المطلوب!

📌 رد بالعربية الفصحى البسيطة للطفل لإخباره أنك وجدت الدرس المطلوب وسيتم عرضه له فوراً.`;
        }
        // Cas où plusieurs cours ont été trouvés (affichage de la liste)
        else if (chatbotResponse.navigation && chatbotResponse.navigation.screen === 'CourseList') {
          const courses = chatbotResponse.navigation.params?.filteredCourses || [];
          const coursesList = courses.map(c => `- ${c.title}`).join('\n');
          prompt += `

✅ لقد وجدت هذه الدروس:
${coursesList}

📌 رد بالعربية الفصحى البسيطة للطفل لإخباره أنك وجدت ${courses.length} دروس تطابق طلبه وسيتم عرض قائمة الدروس له للاختيار.`;
        }
        // Cas où un cours unique a été trouvé mais pas de navigation directe
        else if (chatbotResponse.data && chatbotResponse.data.course) {
          const course = chatbotResponse.data.course;
          prompt += `

✅ لقد وجدت هذا الدرس:
درس: ${course.title || course.titre}

📌 رد بالعربية الفصحى البسيطة للطفل لإخباره أنك وجدت الدرس وسيتم عرضه له.`;
        }
        else {
          // Utiliser le message de la réponse directement
          prompt += `

✅ ${chatbotResponse.message || chatbotResponse.messageAr}

📌 رد بالعربية الفصحى البسيطة للطفل بناءً على المعلومات أعلاه.`;
        }
      }
      // Cas où aucun cours n'a été trouvé
      else {
        prompt += `

❌ لم يتم العثور على الدرس المحدد المطلوب.

📌 اشرح للطفل بالعربية الفصحى البسيطة أنك لم تجد الدرس المحدد، ولكنك ستقترح عليه دروسًا أخرى في نفس المادة قد تهمه.`;
      }
    }
    // Gérer les réponses spécifiques pour voir_meets
    else if (intent === 'voir_meets' && typeof chatbotResponse === 'object' && 'action' in chatbotResponse) {
      console.log('🎯 Traitement spécial pour voir_meets:', chatbotResponse);

      // Vérifier si des meetings ont été trouvés
      if (chatbotResponse.success && chatbotResponse.action === 'SHOW_MEETING_LIST') {
        const meetings = chatbotResponse.payload?.meetings || [];
        const meetingsList = meetings.map(m => `- ${m.teacherName} - ${m.subject} (${m.date})`).join('\n');
        prompt += `

✅ لقد وجدت هذه اللقاءات المباشرة:
${meetingsList}

📌 مهم جداً: رد بالعربية الفصحى الواضحة والبسيطة (ليس بالعربية التونسية أو أي لهجة محلية) والمناسبة للأطفال لإخبار الطفل أنك وجدت ${meetings.length} لقاء مباشر متاح لمستواه وسيتم عرض قائمة اللقاءات له للاختيار منها. استخدم كلمات فصيحة وواضحة فقط.`;
      }
      // Cas où aucun meeting n'a été trouvé
      else {
        prompt += `

❌ لا توجد لقاءات مباشرة متاحة حالياً.

📌 مهم جداً: اشرح للطفل بالعربية الفصحى الواضحة والبسيطة (ليس بالعربية التونسية أو أي لهجة محلية) أنه لا توجد لقاءات مباشرة متاحة حالياً لمستواه، ولكن يمكنه المحاولة لاحقاً. استخدم كلمات فصيحة وواضحة فقط.`;
      }
    }
    // Garder le traitement existant pour les autres types de réponses
    else if (Array.isArray(chatbotResponse) && chatbotResponse.length > 0) {
      const lignes = chatbotResponse.map(item => {
        return item.type === 'PDF'
          ? `\ud83d\udcd8 ${item.titre}\n\ud83d\udcc4 \u0639\u062f\u062f \u0627\u0644\u0635\u0641\u062d\u0627\u062a: ${item.pages}\n\ud83d\udd17 \u0627\u0644\u0631\u0627\u0628\u0637: ${item.lien}`
          : `\ud83d\udcd8 ${item.titre}\n\ud83d\udcc4 \u0627\u0644\u0635\u0641\u062d\u0629: ${item.page}\n\ud83c\udfa5 \u0627\u0644\u0641\u064a\u062f\u064a\u0648: ${item.lien}`;
      }).join("\n\n");
      prompt += `\n\n\ud83d\udd0e \u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062a\u0645\u0627\u0631\u064a\u0646 \u0627\u0644\u062a\u0627\u0644\u064a\u0629:\n${lignes}\n\n\ud83d\udccc \u0642\u062f\u0645 \u0647\u0630\u0647 \u0627\u0644\u062a\u0645\u0627\u0631\u064a\u0646 \u0628\u0644\u063a\u0629 \u0628\u0633\u064a\u0637\u0629 \u0648\u0645\u0634\u062c\u0639\u0629 \u0644\u0644\u0637\u0641\u0644.`;
    } else if (typeof chatbotResponse === 'object') {
      // Pour les autres réponses sous forme d'objet qui ne sont pas des réponses voir_cours
      if (!('navigation' in chatbotResponse)) {
        const lignes = Object.entries(chatbotResponse).map(([k, v]) => `- ${k}: ${v}`).join('\n');
        prompt += `\n\n🔎 هذه هي المعلومات:\n${lignes}\n\n📌 صيغ إجابة واضحة بالعربية الفصحى البسيطة للطفل.`;
      }
    }

    const reply = await getOpenAIResponse(userId, prompt, history, {
      intent,
      matiere: entities.matiere,
      niveau: entities.niveau
    });

    const ttsPath = await textToSpeech(reply);

    // Nettoyer l'URL audio pour éviter les duplications
    let fullTtsPath = cleanAudioUrl(ttsPath);
    console.log('🔊 Chemin audio complet pour frontend:', fullTtsPath);

    // Mise à jour de l'interaction dans la base de données
    await interaction.update({ response: reply, tts: fullTtsPath });

    // S'assurer que le fichier audio a bien été créé avec la voix féminine
    if (ttsPath && !ttsPath.includes('asmaa_female_')) {
      console.log('⚠️ ALERTE: Le fichier audio ne semble pas utiliser la voix Asmaa!');
      // Forcer la régénération avec le bon ID de voix
      try {
        const correctTtsPath = await textToSpeech(reply, 'qi4PkV9c01kb869Vh7Su');
        if (correctTtsPath) {
          // Le service TTS retourne déjà une URL complète avec tous les paramètres
          fullTtsPath = cleanAudioUrl(correctTtsPath);
          console.log('🔁 Fichier audio régénéré avec voix Asmaa:', fullTtsPath);
          // Mettre à jour l'interaction avec le nouveau fichier audio
          await interaction.update({ tts: fullTtsPath });
        }
      } catch (audioError) {
        console.error('❌ Erreur lors de la régénération audio:', audioError);
      }
    }
    
    // Pru00e9parer la ru00e9ponse avec les informations de navigation si disponibles
    const responseData = {
      reply,
      audio: fullTtsPath,
      // Toujours inclure l'ID de voix Asmaa
      voiceId: 'qi4PkV9c01kb869Vh7Su',
      // Forcer le mode fu00e9minin explicitement
      gender: 'female',
      // Ajouter un timestamp pour u00e9viter le cache
      timestamp: Date.now()
    };

    // Ajouter les informations de navigation si disponibles
    if (navigationInfo) {
      responseData.navigation = navigationInfo;
      console.log('🔍 Informations de navigation ajoutu00e9es u00e0 la ru00e9ponse:', navigationInfo);

      // Si c'est une navigation vers CourseList, ajouter les données pour la carte
      if (navigationInfo.screen === 'CourseList' && navigationInfo.params?.filteredCourses) {
        responseData.courseListData = {
          courses: navigationInfo.params.filteredCourses,
          title: navigationInfo.params.title || 'الدروس المتطابقة',
          searchQuery: navigationInfo.params.searchQuery
        };
        console.log(`🔍 Données de liste de cours ajoutées: ${navigationInfo.params.filteredCourses.length} cours`);
      }
    }

    // Ajouter les données du cours si disponibles (pour navigation automatique avec carte)
    if (chatbotResponse && chatbotResponse.courseData) {
      responseData.courseData = chatbotResponse.courseData;
      responseData.recommendationType = 'course';
      console.log('🎯 Données de cours ajoutées pour la carte:', chatbotResponse.courseData.title);
    }

    // Ajouter les données des meetings si disponibles (pour affichage de la carte)
    if (chatbotResponse && chatbotResponse.action === 'SHOW_MEETING_LIST' && chatbotResponse.payload) {
      responseData.action = chatbotResponse.action;
      responseData.payload = chatbotResponse.payload;
      console.log(`🎯 Données de meetings ajoutées pour la carte: ${chatbotResponse.payload.meetings?.length || 0} meetings`);
    }

    // Si des cours similaires u00e9taient disponibles, les inclure dans la ru00e9ponse
    if (chatbotResponse && chatbotResponse.similarCourses) {
      responseData.similarCourses = chatbotResponse.similarCourses;
      console.log(`🔍 ${chatbotResponse.similarCourses.length} cours similaires ajoutu00e9s u00e0 la ru00e9ponse`);
    }
    
    // Log de du00e9bogage pour confirmer l'utilisation de la voix fu00e9minine
    console.log('💬 Ru00e9ponse envoyée avec voix fu00e9minine Asmaa (ID: qi4PkV9c01kb869Vh7Su)');
    
    // Envoyer la ru00e9ponse au frontend
    res.json(responseData);
  } catch (error) {
    console.error('❌ Erreur générale dans askOpenAI :', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Nouvelle fonction pour sauvegarder les messages vocaux
const saveVoiceMessage = async (req, res) => {
  try {
    const { userId, transcription, audioPath, audioDuration, audioSize } = req.body;

    if (!userId || !transcription || !audioPath) {
      return res.status(400).json({
        error: "Paramètres manquants: userId, transcription et audioPath sont requis"
      });
    }

    // Créer l'interaction avec le message vocal
    const interaction = await db.ChatbotInteraction.create({
      user_id: userId,
      message: transcription,
      message_type: 'audio',
      audio_path: audioPath,
      audio_duration: audioDuration || null,
      audio_size: audioSize || null,
      created_at: new Date()
    });

    console.log('🎵 Message vocal sauvegardé:', interaction.id);

    return res.json({
      success: true,
      interaction_id: interaction.id,
      message: "Message vocal sauvegardé avec succès"
    });

  } catch (error) {
    console.error('❌ Erreur sauvegarde message vocal:', error);
    return res.status(500).json({
      error: "Erreur lors de la sauvegarde du message vocal"
    });
  }
};

// Fonction pour générer l'audio à la demande
const generateAudio = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texte requis' });
    }

    console.log('🔊 Génération audio à la demande pour:', text.substring(0, 50) + '...');

    // Générer l'audio avec le service TTS
    const ttsPath = await textToSpeech(text);

    if (!ttsPath) {
      return res.status(500).json({ error: 'Erreur génération audio' });
    }

    // Construire le chemin complet avec cache-busting
    const fullTtsPath = cleanAudioUrl(ttsPath);

    console.log('✅ Audio généré à la demande:', fullTtsPath);

    res.json({
      audioPath: fullTtsPath,
      success: true
    });

  } catch (error) {
    console.error('❌ Erreur génération audio à la demande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { askOpenAI, saveVoiceMessage, generateAudio };
