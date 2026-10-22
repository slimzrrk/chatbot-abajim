const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const db = require('../models');

/**
 * Extrait les entités liées aux cours depuis le message utilisateur
 * @param {string} userMessage - Message de l'utilisateur
 * @returns {Promise<Object>} - Entités extraites (nom du cours, matière, niveau, etc.)
 */
const extractCourseEntities = async (userMessage) => {
  try {
    const prompt = `
Tu es un assistant spécialisé dans l'extraction d'entités liées aux cours éducatifs.

Message de l'utilisateur: "${userMessage}"

DIRECTIVES IMPORTANTES:
1. Identifie TOUS les concepts éducatifs mentionnés, même partiellement
2. Sois attentif aux termes mathématiques en arabe comme "ضرب" (multiplication), "قسمة" (division), etc.
3. Considère les variations comme "ضرب" et "الضرب" comme le même concept
4. Extrais le concept même s'il est mentionné dans un contexte (ex: "cours sur le ضرب")

Extrais les entités suivantes du message:
1. Nom du cours ou concept principal (courseName): Le sujet spécifique mentionné (ex: ضرب, كسور, fractions, multiplication)
2. Matière (subject): La matière concernée si mentionnée (ex: رياضيات, mathématiques, sciences)
3. Niveau (level): Le niveau scolaire si mentionné
4. Nom de l'enseignant (teacherName): Si un enseignant spécifique est mentionné

Concepts mathématiques courants en arabe:
- Multiplication: ضرب, الضرب, ضرب في, الضرب في
- Division: قسمة, القسمة
- Addition: جمع, الجمع, إضافة
- Soustraction: طرح, الطرح
- Fractions: كسور, الكسور

Réponds uniquement avec un objet JSON au format suivant:
{
  "courseName": "le nom du cours ou concept principal, JAMAIS null si un concept mathématique est mentionné",
  "subject": "la matière ou null",
  "level": "le niveau ou null",
  "teacherName": "le nom de l'enseignant ou null"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es un assistant spécialisé dans l'extraction d'entités éducatives." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content.trim();
    let entities = {};

    try {
      // Nettoyer la réponse pour s'assurer qu'elle est au format JSON valide
      const cleanedContent = content.replace(/```json|```/g, '').trim();
      entities = JSON.parse(cleanedContent);
      console.log("✅ Entités de cours extraites:", entities);
    } catch (error) {
      console.error("❌ Erreur lors du parsing JSON des entités:", error.message);
      console.log("Réponse brute:", content);
      entities = {
        courseName: null,
        subject: null,
        level: null,
        teacherName: null
      };
    }

    return entities;
  } catch (error) {
    console.error("❌ Erreur lors de l'extraction des entités:", error.message);
    return {
      courseName: null,
      subject: null,
      level: null,
      teacherName: null
    };
  }
};

/**
 * Charge les données complètes des cours avec leurs chapitres et fichiers
 * @param {number} levelId - ID du niveau scolaire
 * @param {Array} matiereIds - Liste des IDs de matières
 * @returns {Promise<Array>} - Liste des cours avec leurs chapitres et fichiers
 */
const loadCourseData = async (levelId, matiereIds) => {
  try {
    console.log(`📚 Chargement des données complètes pour le niveau ${levelId} et les matières ${matiereIds}`);
    
    // Récupérer les informations des matières pour les utiliser plus tard
    let materials = [];
    try {
      materials = await db.Material.findAll({
        where: {
          id: { [db.Sequelize.Op.in]: matiereIds }
        },
        attributes: ["id", "name"]
      });
      console.log(`✅ ${materials.length} matières trouvées`);
    } catch (materialError) {
      console.error("❌ Erreur lors du chargement des matières:", materialError.message);
    }
    
    // Simplifier la requête pour éviter les erreurs d'association
    const courses = await db.Webinar.findAll({
      where: {
        level_id: levelId,
        matiere_id: { [db.Sequelize.Op.in]: matiereIds },
        deleted_at: null
      },
      include: [
        {
          model: db.User,
          as: "teacher",
          attributes: ["id", "full_name", "avatar"]
        },
        {
          model: db.WebinarTranslation,
          attributes: ["title", "locale", "description"]
        }
      ]
    });
    
    // Ajouter manuellement les informations de matière à chaque cours
    courses.forEach(course => {
      if (course.matiere_id) {
        const material = materials.find(m => m.id === course.matiere_id);
        if (material) {
          course.dataValues.material = {
            id: material.id,
            name: material.name
          };
        }
      }
    });

    // Charger les chapitres et fichiers séparément pour chaque cours
    const coursesWithDetails = await Promise.all(courses.map(async (course) => {
      const courseJson = course.toJSON();
      
      // Charger les chapitres
      const chapters = await db.WebinarChapter.findAll({
        where: { webinar_id: course.id },
        attributes: ["id", "order"],
        include: [
          {
            model: db.User,
            attributes: ["id", "full_name"]
          }
        ]
      });
      
      // Pour chaque chapitre, charger les fichiers
      const chaptersWithFiles = await Promise.all(chapters.map(async (chapter) => {
        const chapterJson = chapter.toJSON();
        
        // Charger les fichiers du chapitre
        const files = await db.File.findAll({
          where: { 
            chapter_id: chapter.id,
            status: "active"
          },
          include: [
            {
              model: db.FileTranslation,
              as: "translations",
              attributes: ["title", "locale", "description"]
            }
          ]
        });
        
        chapterJson.files = files;
        return chapterJson;
      }));
      
      courseJson.chapters = chaptersWithFiles;
      return courseJson;
    }));

    console.log(`✅ ${coursesWithDetails.length} cours chargés pour le niveau ${levelId} et les matières ${matiereIds.join(', ')}`);
    return coursesWithDetails;
  } catch (error) {
    console.error("❌ Erreur lors du chargement des données de cours:", error.message);
    return [];
  }
};

/**
 * Trouve les cours correspondant à la demande de l'utilisateur en utilisant GPT
 * @param {string} userMessage - Message de l'utilisateur
 * @param {Array} courses - Liste des cours disponibles
 * @returns {Promise<Array>} - Liste des cours correspondants avec leur score de pertinence
 */
const findMatchingCourses = async (userMessage, courses) => {
  // Si aucun cours n'est disponible, retourner un tableau vide
  if (!courses || courses.length === 0) {
    return [];
  }

  // Préparer les données des cours pour le prompt
  const courseData = courses.map(course => {
    // Récupérer les titres du cours dans toutes les langues disponibles
    const courseTitles = [];
    if (course.WebinarTranslations && course.WebinarTranslations.length > 0) {
      course.WebinarTranslations.forEach(translation => {
        if (translation.title) {
          courseTitles.push({
            locale: translation.locale,
            title: translation.title,
            description: translation.description || ''
          });
        }
      });
    }
    
    // Récupérer les informations des chapitres
    const chapters = (course.chapters || []).map(chapter => {
      // Récupérer le titre du chapitre (préférer l'arabe si disponible)
      const chapterTitle = chapter.translations && chapter.translations.length > 0
        ? chapter.translations.find(t => t.locale === 'ar')?.title || chapter.translations[0].title
        : `Chapitre ${chapter.order}`;

      // Récupérer les fichiers du chapitre
      const files = (chapter.files || []).map(file => {
        // Récupérer tous les titres de fichiers disponibles
        const fileTitles = [];
        if (file.translations && file.translations.length > 0) {
          file.translations.forEach(translation => {
            if (translation.title) {
              fileTitles.push({
                locale: translation.locale,
                title: translation.title,
                description: translation.description || ''
              });
            }
          });
        }
        
        const fileTitle = file.translations && file.translations.length > 0
          ? file.translations.find(t => t.locale === 'ar')?.title || file.translations[0].title
          : 'Fichier sans titre';

        return {
          id: file.id,
          title: fileTitle,
          allTitles: fileTitles,
          type: file.file_type
        };
      });

      return {
        id: chapter.id,
        title: chapterTitle,
        order: chapter.order,
        files: files
      };
    });

    // Récupérer le nom de la matière
    const matiereName = course.material ? course.material.name : (course.matiere ? course.matiere.name : 'Matière non spécifiée');

    return {
      id: course.id,
      title: course.slug || 'Cours sans titre',
      allTitles: courseTitles,
      description: course.description || '',
      matiere: matiereName,
      teacher: course.teacher ? course.teacher.full_name : 'Enseignant non spécifié',
      chapters: chapters
    };
  });

  // Créer le prompt pour GPT
  const prompt = {
    user_message: userMessage,
    cours_disponibles: courseData
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant spécialisé dans la recherche sémantique de cours éducatifs.
Ta tâche est d'analyser le message d'un utilisateur et de trouver les cours les plus pertinents parmi une liste fournie.
Tu dois comprendre les concepts éducatifs en arabe et en français, et faire correspondre les demandes des utilisateurs avec les cours disponibles.

DIRECTIVES IMPORTANTES:
1. Recherche TOUS les cours qui contiennent le terme recherché, même partiellement
2. Considère les variations du même concept (ex: "ضرب", "الضرب", "ضرب في", etc.)
3. Examine attentivement les titres de cours ET les titres des fichiers dans chaque cours
4. Cherche dans toutes les langues disponibles (arabe, français)
5. Priorise les correspondances exactes, mais inclus aussi les correspondances partielles
6. Attribue un score de pertinence élevé (>70) même pour les correspondances partielles

Exemples de concepts mathématiques et leurs variations:
- Multiplication: "ضرب", "الضرب", "ضرب في", "الضرب في", "multiplication"
- Division: "قسمة", "القسمة", "division"
- Addition: "جمع", "الجمع", "إضافة", "addition"
- Soustraction: "طرح", "الطرح", "soustraction"
- Fractions: "كسور", "الكسور", "fractions"

Réponds avec un objet JSON au format suivant:
{
  "courses": [
    {
      "courseId": 123,
      "relevance": 85,
      "matchReason": "Le cours contient 'ضرب' dans son titre"
    },
    ...
  ]
}`
        },
        {
          role: "user",
          content: JSON.stringify(prompt, null, 2)
        }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content.trim();
    let matchingCourses = [];

    try {
      // Nettoyer la réponse pour s'assurer qu'elle est au format JSON valide
      const cleanedContent = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedContent);
      
      if (parsed.courses && Array.isArray(parsed.courses)) {
        matchingCourses = parsed.courses;
        
        // Recherche additionnelle dans les fichiers pour chaque cours
        if (matchingCourses.length === 0) {
          console.log("Aucun cours correspondant trouvé par GPT, recherche manuelle dans les fichiers...");
          
          // Recherche manuelle dans les titres de cours et fichiers
          courses.forEach(course => {
            // Extraire les termes de recherche du message utilisateur
            const searchTerms = userMessage.toLowerCase().split(/\s+/);
            let foundMatch = false;
            let matchReason = '';
            
            // Vérifier dans les titres de cours
            if (course.WebinarTranslations) {
              course.WebinarTranslations.forEach(translation => {
                if (translation.title && searchTerms.some(term => translation.title.toLowerCase().includes(term))) {
                  foundMatch = true;
                  matchReason = `Correspondance dans le titre du cours: ${translation.title}`;
                }
              });
            }
            
            // Vérifier dans les chapitres et fichiers
            if (!foundMatch && course.chapters) {
              course.chapters.forEach(chapter => {
                if (chapter.files) {
                  chapter.files.forEach(file => {
                    if (file.translations) {
                      file.translations.forEach(translation => {
                        if (translation.title && searchTerms.some(term => translation.title.toLowerCase().includes(term))) {
                          foundMatch = true;
                          matchReason = `Correspondance dans le fichier: ${translation.title}`;
                        }
                      });
                    }
                  });
                }
              });
            }
            
            if (foundMatch) {
              matchingCourses.push({
                courseId: course.id,
                relevance: 75,
                matchReason: matchReason
              });
            }
          });
        }
      }
      
      console.log(`✅ ${matchingCourses.length} cours correspondants trouvés`);
    } catch (error) {
      console.error("❌ Erreur lors du parsing JSON des cours correspondants:", error.message);
      console.log("Réponse brute:", content);
      
      // Fallback: recherche manuelle simple
      console.log("Tentative de recherche manuelle après échec du parsing...");
      courses.forEach(course => {
        // Recherche simple dans le titre du cours
        if (course.slug && userMessage.toLowerCase().includes(course.slug.toLowerCase())) {
          matchingCourses.push({
            courseId: course.id,
            relevance: 70,
            matchReason: `Correspondance dans le titre: ${course.slug}`
          });
        }
      });
    }

    // Enrichir les résultats avec les objets de cours complets
    const enrichedResults = matchingCourses.map(match => {
      const course = courses.find(c => c.id === match.courseId);
      return {
        course: course,
        relevance: match.relevance,
        matchReason: match.matchReason || 'Correspondance sémantique'
      };
    }).filter(item => item.course); // Filtrer les cours non trouvés

    // Trier par pertinence décroissante
    const sortedResults = enrichedResults.sort((a, b) => b.relevance - a.relevance);
    
    // Détails des cours trouvés pour debug
    if (sortedResults.length > 0) {
      console.log(`👁‍🗨 Détails des ${sortedResults.length} cours trouvés:`);
      sortedResults.forEach((result, index) => {
        const course = result.course;
        const arTitle = course.WebinarTranslations?.find(t => t.locale === 'ar')?.title || 'Pas de titre arabe';
        const frTitle = course.WebinarTranslations?.find(t => t.locale === 'fr')?.title || 'Pas de titre français';
        console.log(`  ${index + 1}. ID=${course.id}, Pertinence=${result.relevance}, Raison=${result.matchReason}`);
        console.log(`     Titre AR: ${arTitle}`);
        console.log(`     Titre FR: ${frTitle}`);
        console.log(`     Slug: ${course.slug}`);
      });
    }
    
    return sortedResults;
  } catch (error) {
    console.error("❌ Erreur lors de la recherche de cours correspondants:", error.message);
    return [];
  }
};

/**
 * Trouve le meilleur cours correspondant au nom mentionné par l'utilisateur
 * @param {string} userMessage - Message de l'utilisateur mentionnant un cours
 * @param {Array} courses - Liste des cours disponibles
 * @returns {Promise<Object>} - Résultat contenant les cours correspondants et leur pertinence
 */
const getBestCourseName = async (userMessage, courses) => {
  try {
    // Extraire les entités du message utilisateur
    const entities = await extractCourseEntities(userMessage);
    console.log("📌 Entités extraites:", entities);

    // Trouver les cours correspondants
    const matchingCourses = await findMatchingCourses(userMessage, courses);
    
    // Préparer la réponse
    const result = {
      entities: entities,
      matchingCourses: matchingCourses,
      hasSingleMatch: matchingCourses.length === 1,
      hasMultipleMatches: matchingCourses.length > 1,
      hasNoMatches: matchingCourses.length === 0
    };

    // Si au moins un cours a été trouvé, ajouter le meilleur match
    if (matchingCourses.length > 0) {
      result.bestMatch = matchingCourses[0].course;
      
      // Debug pour vérifier la structure du résultat
      console.log(`💡 STRUCTURE DU RÉSULTAT:`);
      console.log(`- matchingCourses: ${result.matchingCourses.length} cours`);
      console.log(`- hasSingleMatch: ${result.hasSingleMatch}`);
      console.log(`- hasMultipleMatches: ${result.hasMultipleMatches}`);
      console.log(`- hasNoMatches: ${result.hasNoMatches}`);
      console.log(`- bestMatch: ${result.bestMatch ? result.bestMatch.id : 'non défini'}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Erreur dans getBestCourseName:", error.message);
    return {
      entities: {
        courseName: null,
        subject: null,
        level: null,
        teacherName: null
      },
      matchingCourses: [],
      hasSingleMatch: false,
      hasMultipleMatches: false,
      hasNoMatches: true
    };
  }
};

module.exports = { 
  getBestCourseName,
  extractCourseEntities,
  loadCourseData,
  findMatchingCourses
};
