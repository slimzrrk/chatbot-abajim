const db = require('../models');

const ChatbotService = {
  async getTeachersWithSubjects(matiere, niveau) {
    try {
      const whereWebinar = {};

      // Filtrage par matière (matiere_id)
      if (matiere) {
        const material = await db.Material.findOne({ where: { name: matiere } });
        if (material) {
          whereWebinar.matiere_id = material.id;
        }
      }

      // Filtrage par niveau (level_id)
      if (niveau) {
        const levelMap = {
          "السنة الأولى": 6,
          "السنة الثانية": 7,
          "السنة الثالثة": 8,
          "السنة الرابعة": 9,
          "السنة الخامسة": 10,
          "السنة السادسة": 11,
        };
        const levelId = levelMap[niveau];
        if (levelId) {
          whereWebinar.level_id = levelId;
        }
      }

      const teachers = await db.User.findAll({
        where: { role_name: 'teacher', status: 'active' },
        attributes: ['id', 'full_name', 'avatar', 'bio'],
        include: {
          model: db.Webinar,
          as: 'webinars',
          where: whereWebinar,
          attributes: ['matiere_id', 'level_id'],
          include: {
            model: db.Material,
            attributes: ['name']
          }
        }
      });

      return teachers;
    } catch (error) {
      console.error("❌ Erreur getTeachersWithSubjects:", error.message);
      return [];
    }
  }

  ,

  async getDetailedWebinars(matiere, niveau) {
    const whereConditions = { status: 'active' };

    // Recherche de l'ID matière si précisé
    if (matiere) {
      const material = await db.Material.findOne({ where: { name: matiere } });
      if (material) {
        whereConditions.matiere_id = material.id;
      }
    }

    // Mapping des niveaux → level_id
    if (niveau) {
      const levelMap = {
        "السنة الأولى": 6,
        "السنة الثانية": 7,
        "السنة الثالثة": 8,
        "السنة الرابعة": 9,
        "السنة الخامسة": 10,
        "السنة السادسة": 11,
      };
      const levelId = levelMap[niveau];
      if (levelId) {
        whereConditions.level_id = levelId;
      }
    }

    return await db.Webinar.findAll({
      where: whereConditions,
      attributes: ['id', 'slug', 'type', 'price', 'created_at'],
      include: [
        { model: db.Material, attributes: ['name'] },
        { model: db.SchoolLevel, attributes: ['name'] },
        { model: db.User, as: 'teacher', attributes: ['full_name'] }
      ]
    });
  },

  async getDetailedManuels() {
    return await db.Manuel.findAll({
      attributes: ['id', 'name', 'logo', 'created_at'],
      include: {
        model: db.Material,
        attributes: ['name']
      }
    });
  },

  async getDetailedManuels(matiere, niveau) {
    const whereConditions = {};

    if (matiere) {
      const material = await db.Material.findOne({ where: { name: matiere } });
      if (material) {
        whereConditions.material_id = material.id;
      }
    }

    if (niveau) {
      // Ici on suppose que opt_id = niveau
      // Tu peux adapter selon comment tu stockes les niveaux dans ta base
      const levelMap = {
        "السنة الأولى": 6,
        "السنة الثانية": 7,
        "السنة الثالثة": 8,
        "السنة الرابعة": 9,
        "السنة الخامسة": 11,
        "السنة السادسة": 12
      };
      const optId = levelMap[niveau];
      if (optId) {
        whereConditions.opt_id = optId;
      }
    }

    return await db.Manuel.findAll({
      where: whereConditions,
      attributes: ['id', 'name', 'logo', 'created_at'],
      include: {
        model: db.Material,
        attributes: ['name']
      }
    });
  },


  async getQuizzesWithWebinars(matiere, niveau) {
    const whereWebinar = {};
  
    // Recherche par matière
    if (matiere) {
      const material = await db.Material.findOne({ where: { name: matiere } });
      if (material) {
        whereWebinar.matiere_id = material.id;
      }
    }
  
    // Recherche par niveau
    if (niveau) {
      const levelMap = {
        "السنة الأولى": 6,
        "السنة الثانية": 7,
        "السنة الثالثة": 8,
        "السنة الرابعة": 9,
        "السنة الخامسة": 11,
        "السنة السادسة": 12
      };
      const levelId = levelMap[niveau];
      if (levelId) {
        whereWebinar.level_id = levelId;
      }
    }
  
    return await db.Quiz.findAll({
      where: { status: 'active' },
      attributes: ['id', 'title', 'pass_mark', 'time'],
      include: {
        model: db.Webinar,
        where: whereWebinar,
        attributes: ['slug', 'matiere_id', 'level_id'],
        include: {
          model: db.Material,
          attributes: ['name']
        }
      }
    });
  },
  

  async getDocumentsByManuel(matiere, niveau) {
    const whereManuel = {};
  
    // Filtrage matière
    if (matiere) {
      const material = await db.Material.findOne({ where: { name: matiere } });
      if (material) {
        whereManuel.material_id = material.id;
      }
    }
  
    // Filtrage niveau via opt_id
    if (niveau) {
      const levelMap = {
        "السنة الأولى": 6,
        "السنة الثانية": 7,
        "السنة الثالثة": 8,
        "السنة الرابعة": 9,
        "السنة الخامسة": 11,
        "السنة السادسة": 12
      };
      const optId = levelMap[niveau];
      if (optId) {
        whereManuel.opt_id = optId;
      }
    }
  
    return await db.Document.findAll({
      attributes: ['id', 'name', 'manuel_id', 'pdf'],
      include: {
        model: db.Manuel,
        where: whereManuel,
        attributes: ['name']
      }
    });
  }
  ,

  async getLiveMeetings(matiere, niveau) {
    const whereMeetingTime = {};
  
    // Conversion matière -> matiere_id
    if (matiere) {
      const material = await db.Material.findOne({ where: { name: matiere } });
      if (material) {
        whereMeetingTime.matiere_id = material.id;
      }
    }
  
    // Conversion niveau -> level_id
    if (niveau) {
      const levelMap = {
        "السنة الأولى": 6,
        "السنة الثانية": 7,
        "السنة الثالثة": 8,
        "السنة الرابعة": 9,
        "السنة الخامسة": 11,
        "السنة السادسة": 12
      };
      const levelId = levelMap[niveau];
      if (levelId) {
        whereMeetingTime.level_id = levelId;
      }
    }
  
    return await db.Meeting.findAll({
      where: { disabled: false },
      include: [
        {
          model: db.User,
          as: 'teacher',
          attributes: ['full_name']
        },
        {
          model: db.MeetingTime,
          as: 'meetingTimes',
          where: whereMeetingTime,
          required: true
        }
      ]
    });
  },

  async getSubscribes(niveau) {
    const whereConditions = {};
  
    // Mapper le niveau vers level_id si précisé
    if (niveau) {
      const levelMap = {
        "السنة الأولى": 6,
        "السنة الثانية": 7,
        "السنة الثالثة": 8,
        "السنة الرابعة": 9,
        "السنة الخامسة": 11,
        "السنة السادسة": 12
      };
      const levelId = levelMap[niveau];
      if (levelId) {
        whereConditions.level_id = levelId;
      }
    }
  
    return await db.Subscribe.findAll({
      where: whereConditions,
      attributes: ['id', 'days', 'price', 'usable_count', 'level_id']
    });
  },

  async getTeachersWithFollowers(matiere, niveau) {
    const whereWebinar = {};
  
    if (matiere) {
      const material = await db.Material.findOne({ where: { name: matiere } });
      if (material) {
        whereWebinar.matiere_id = material.id;
      }
    }
  
    if (niveau) {
      const levelMap = {
        "السنة الأولى": 6,
        "السنة الثانية": 7,
        "السنة الثالثة": 8,
        "السنة الرابعة": 9,
        "السنة الخامسة": 11,
        "السنة السادسة": 12
      };
      const levelId = levelMap[niveau];
      if (levelId) {
        whereWebinar.level_id = levelId;
      }
    }
  
    const teachers = await db.User.findAll({
      where: { role_name: 'teacher', status: 'active' },
      attributes: ['id', 'full_name', 'avatar'],
      include: [
        {
          model: db.Webinar,
          as: 'webinars',
          where: whereWebinar,
          attributes: []
        },
        {
          model: db.Follow,
          attributes: ['id']
        }
      ]
    });
  
    // ✅ Ajouter le nombre de followers manuellement
    const enrichedTeachers = teachers.map(t => ({
      ...t.toJSON(),
      followers_count: t.Follows.length
    }));
  
    return enrichedTeachers;
  }
  ,

  handleSimpleIntent(intent) {
    const replies = {
      accueil: "👋 أهلاً وسهلاً بك في منصة أبجيم! أنا هنا لمساعدتك في التعلم والمرح 🌟",
      aide: "🧠 يمكنك سؤالي عن الدروس، المعلمين، الكتب، الكويزات أو الاشتراك، وسأجيبك بكل سرور!",
      abonnement_platforme: "📱 للاشتراك في منصة أبجيم، اطلب من ولي أمرك تسجيل الدخول إلى صفحة الاشتراك.",
      ignorer_contenu: "⚠️ هذا النوع من الأسئلة غير مناسب. لنركز على التعلم معًا! 😊",
      autre: "🤔 لم أفهم تمامًا... هل يمكنك إعادة صياغة سؤالك بطريقة أخرى؟"
    };
    return replies[intent] || replies["autre"];
  }
};

module.exports = ChatbotService;