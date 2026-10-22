// services/ChatbotMobileService.js
const db = require("../models");
const Material = db.Material;
const { getBestManuelName } = require('./manuelFinder');
const WebinarService = require("./WebinarService");
const videoService = require("./videoService");
const manuelService = require("./manuelService");
const MeetingService = require("./MeetingService");
const LikeService = require("./LikeService");
const FollowService = require("./FollowService");
const NotificationService = require("./NotificationService");
const TeacherService = require("./TeacherService");
const enfantService = require("./enfantService");
const SaleService = require("./SaleService");
const documentService = require("./documentService");
const userService = require("./userService");
const RecommendationService = require("./RecommendationService");
const ProgressiveRecommendationService = require("./ProgressiveRecommendationService");
const RecommendationHistoryService = require("./RecommendationHistoryService");
const { getHistory, addToHistory } = require('./chatMemory');
const { getOpenAIResponse } = require('./openaiService');
const logger = require('../utils/logger');

const normalize = (s) => s?.trim()?.toLowerCase().replace(/\s/g, '');
const Webinar = require("../models/Webinar");
const User = require("../models/User");
const WebinarChapter = require("../models/WebinarChapter");
const File = require("../models/File");
const FileTranslation = require("../models/FileTranslation");
const matchMatiere = (matiereDB, matiereUser) => {
    const map = {
        'رياضيات': ['رياضيات', 'رياضة', 'math'],
        'الإيقاظ العلمي': ['إيقاظ', 'الإيقاظ', 'علوم', 'science'],
        'الفرنسية': ['فرنسية', 'فرنساوي', 'français'],
        'العربية': ['عربية', 'عربي', 'arabe']
    };

    for (let [dbLabel, variants] of Object.entries(map)) {
        if (variants.some(v => normalize(v) === normalize(matiereUser))) {
            return normalize(matiereDB) === normalize(dbLabel);
        }
    }

    // fallback exact
    return normalize(matiereDB) === normalize(matiereUser);
};


// Mapping local entre levelId et matière_ids
// Niveau 6 = 1ère année, Niveau 7 = 2ème année, ..., Niveau 11 = 6ème année
const manualLevelMapping = {
    6: [1, 1, 2],        // 1ère année
    7: [3, 4, 4],        // 2ème année
    8: [5, 5, 6, 7, 7, 8],   // 3ème année
    9: [9, 9, 10, 11, 11, 12, 12],   // 4ème année
    10: [13, 14, 14, 15, 16, 16, 17, 17],   // 5ème année
    11: [18, 18, 19, 20, 21, 21, 22, 22, 23]   // 6ème année
};



const stringSimilarity = require('string-similarity');

function findClosestManuel(manuels, manuelName) {
    const target = normalize(manuelName);
    if (!target || !manuels || manuels.length === 0) return null;

    const matches = manuels.map(m => ({
        manuel: m,
        score: stringSimilarity.compareTwoStrings(normalize(m.name), target)
    }));

    const best = matches.sort((a, b) => b.score - a.score)[0];
    return best?.score > 0.5 ? best.manuel : null;
}

async function repondreAvecMemoireMix(userId, message, context = {}) {
    try {
        const history = await getHistory(userId);
        const gptReply = await getOpenAIResponse(userId, message, history, context);
        await addToHistory(userId, message, gptReply);
        return { message: gptReply };
    } catch (error) {
        console.error('❌ Erreur GPT avec mémoire :', error.message);
        return { error: "Erreur lors de la réponse intelligente." };
    }
}

module.exports = {
    repondreAvecMemoireMix,
    async voir_cours(levelId, matiereName, userMessage = null) {
        try {
            const db = require('../models');
            const { Op } = require('sequelize');

            console.log(`🔍 Traitement de l'intention voir_cours avec message: "${userMessage}"`);

            // Fonction pour charger les données complètes des cours avec leurs chapitres et fichiers
            async function loadCourseData(levelId, matiereIds) {
                console.log(`📚 Chargement des cours pour niveau ${levelId} et matières [${matiereIds.join(', ')}]`);

                const courses = await db.Webinar.findAll({
                    where: {
                        matiere_id: { [db.Sequelize.Op.in]: matiereIds },
                        level_id: levelId,
                        status: { [db.Sequelize.Op.in]: ['active', 'pending'] }, // Inclure pending aussi
                        deleted_at: null
                    },
                    include: [
                        {
                            model: db.User,
                            as: 'teacher',
                            attributes: ['id', 'full_name', 'avatar']
                        },
                        {
                            model: db.WebinarTranslation,
                            attributes: ['title', 'locale', 'description']
                        },
                        {
                            model: db.WebinarChapter,
                            as: 'chapters',
                            attributes: ['id', 'order', 'webinar_id'],
                            where: { status: 'active' },
                            required: false,
                            include: [
                                {
                                    model: db.File,
                                    as: 'files',
                                    attributes: ['id', 'file', 'file_type', 'order'],
                                    where: { status: 'active' },
                                    required: false,
                                    include: [
                                        {
                                            model: db.FileTranslation,
                                            as: 'translations',
                                            attributes: ['title', 'locale', 'description']
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    order: [
                        ['id', 'ASC'],
                        [{ model: db.WebinarChapter, as: 'chapters' }, 'order', 'ASC'],
                        [{ model: db.WebinarChapter, as: 'chapters' }, { model: db.File, as: 'files' }, 'order', 'ASC']
                    ]
                });

                console.log(`✅ ${courses.length} cours chargés avec leurs chapitres et fichiers`);
                return courses;
            }

            // 🔍 Obtenir tous les matiere_id possibles pour ce niveau
            const matiereIds = manualLevelMapping[levelId] || [];

            // 🔍 Récupérer tous les ID correspondants au nom donné (dans la liste du mapping)
            // Support pour les noms en arabe et français
            const materials = await db.Material.findAll({
                where: {
                    [Op.or]: [
                        { name: matiereName },
                        { name: 'رياضيات' }, // Support pour "رياضيات" si on demande "Mathématiques"
                        { name: 'Mathématiques' } // Support pour "Mathématiques"
                    ],
                    id: { [Op.in]: matiereIds }
                }
            });

            if (!materials || materials.length === 0) {
                return { 
                    success: false, 
                    message: `❌ عذرًا، لم أجد مادة "${matiereName}" في المستوى ${levelId}.`,
                    navigation: null
                };
            }

            const matchingMatiereIds = materials.map(m => m.id);

            // Charger les données complètes des cours avec leurs chapitres et fichiers
            console.log(`📚 Chargement des données complètes pour le niveau ${levelId} et les matières ${matchingMatiereIds.join(', ')}`);
            
            // Utiliser la fonction loadCourseData pour récupérer toutes les données nécessaires
            const webinars = await loadCourseData(levelId, matchingMatiereIds);

            if (!webinars || webinars.length === 0) {
                return { 
                    success: false, 
                    message: `📚 لا يوجد دروس حالياً في "${matiereName}" للمستوى ${levelId}.`,
                    navigation: null
                };
            }

            // Si un message utilisateur est fourni, utiliser le service de navigation intelligent
            if (userMessage && userMessage.trim() !== "") {
                console.log(`🎯 Utilisation du service de navigation intelligent pour: "${userMessage}"`);

                try {
                    const CourseNavigationService = require('./CourseNavigationService');
                    const navigationResult = await CourseNavigationService.processVoirCoursIntention(
                        levelId,
                        matiereName,
                        userMessage,
                        matchingMatiereIds
                    );

                    if (navigationResult.success) {
                        console.log(`✅ Navigation intelligente réussie`);
                        return {
                            success: true,
                            message: navigationResult.responseAr || navigationResult.response,
                            messageAr: navigationResult.responseAr,
                            messageFr: navigationResult.responseFr,
                            data: navigationResult.data,
                            navigation: navigationResult.navigation,
                            courseData: navigationResult.courseData
                        };
                    } else {
                        console.log(`⚠️ Navigation intelligente n'a pas trouvé de correspondance`);
                        // Continuer avec la logique par défaut
                    }
                } catch (navigationError) {
                    console.error('❌ Erreur avec le service de navigation intelligent:', navigationError);
                    // Continuer avec la logique par défaut
                }
            }

            // Si aucun message utilisateur ou erreur avec courseFinder, retourner tous les cours disponibles
            let allWebinars = [];
            try {
                allWebinars = await db.Webinar.findAll({
                    where: {
                        matiere_id: { [db.Sequelize.Op.in]: matiereIds },
                        level_id: levelId,
                        status: { [db.Sequelize.Op.in]: ['active', 'pending'] }, // Inclure pending aussi
                        deleted_at: null
                    },
                    include: [
                        {
                            model: db.User,
                            as: 'teacher',
                            attributes: ['id', 'full_name', 'avatar']
                        },
                        {
                            model: db.WebinarTranslation,
                            attributes: ['title', 'locale', 'description']
                        }
                    ]
                });

                if (allWebinars.length === 0) {
                    return {
                        success: false,
                        message: `للأسف، لم نجد دروساً متاحة في ${matiereName} للمستوى المحدد.`,
                        messageAr: `للأسف، لم نجد دروساً متاحة في ${matiereName} للمستوى المحدد.`,
                        messageFr: `Désolé, nous n'avons pas trouvé de cours disponibles en ${matiereName} pour le niveau spécifié.`
                    };
                }

                const formattedWebinars = allWebinars.map(webinar => ({
                    id: webinar.id,
                    title: webinar.WebinarTranslations?.find(t => t.locale === 'ar')?.title || 
                           webinar.WebinarTranslations?.find(t => t.locale === 'fr')?.title || 
                           'Cours sans titre',
                    image: webinar.image_cover,
                    teacher: webinar.teacher?.full_name || 'Enseignant inconnu'
                }));

                return {
                    success: true,
                    message: `لدينا ${formattedWebinars.length} دروس متاحة في ${matiereName}. إليك القائمة:`,
                    messageAr: `لدينا ${formattedWebinars.length} دروس متاحة في ${matiereName}. إليك القائمة:`,
                    messageFr: `Nous avons ${formattedWebinars.length} cours disponibles en ${matiereName}. Les voici:`,
                    data: {
                        courses: formattedWebinars,
                        navigation: {
                            screen: 'CourseList',
                            params: {
                                matiere: matiereName,
                                levelId: levelId
                            }
                        }
                    }
                };
            } catch (dbError) {
                console.error('❌ Erreur lors de la recherche des cours disponibles:', dbError);
                return {
                    success: false,
                    message: 'Désolé, une erreur est survenue lors de la recherche des cours.',
                    messageAr: 'عذرًا، حدث خطأ أثناء البحث عن الدروس.',
                    messageFr: 'Désolé, une erreur est survenue lors de la recherche des cours.'
                };
            }
        } catch (error) {
            console.error('❌ Erreur dans voir_cours:', error);
            return {
                success: false,
                message: 'Désolé, une erreur est survenue lors de la recherche des cours.',
                messageAr: 'عذرًا، حدث خطأ أثناء البحث عن الدروس.',
                messageFr: 'Désolé, une erreur est survenue lors de la recherche des cours.'
            };
        }
    },


    async voir_exercices(levelId, matiere, options = {}) {
        try {
            const { manuelName, page } = options;

            // 📘 Récupération de tous les manuels du niveau
            const manuels = await manuelService.getManuelsByLevel(levelId);

            // 🧠 Fonction d’aide pour trouver le manuel le plus proche
            const normalize = (s) => s?.trim()?.toLowerCase().replace(/\s/g, '');

            // 🔍 Trouver le manuel correspondant par nom ou matière
            const manuel = manuelName
                ? findClosestManuel(manuels, manuelName)
                : manuels.find(m => matchMatiere(m.material?.name, matiere));

            if (!manuel) {
                return {
                    message: `❌ لم أجد كتابًا لهذه المادة أو الاسم "${manuelName}" غير معروف.`
                };
            }

            // ✅ Forcer la matière à celle du manuel détecté
            if (manuel.material && manuel.material.name) {
                matiere = manuel.material.name;
                console.log("🎯 Mise à jour automatique de la matière selon le manuel :", matiere);
            }

            console.log("📘 Manuel sélectionné :", manuel.name, "| ID:", manuel.id);

            // 🎯 Récupérer les vidéos associées à ce manuel
            const videos = await videoService.getVideosByManuelId(manuel.id, page);

            const filteredVideos = page
                ? videos.filter(v => v.page && String(v.page).trim() === String(page).trim())
                : videos;

            if (filteredVideos.length > 0) {
                return filteredVideos.map(v => ({
                    titre: v.titre || "📹 فيديو تمرين",
                    lien: v.video,
                    page: v.page,
                    description: v.description || '',
                    thumbnail: v.thumbnail || null
                }));
            }

            // 📄 Fallback PDF (uniquement s’il contient "تمرين" ou "exercice" dans le nom ?)
            const docs = await documentService.getDocumentsByManuel(manuel.id);

            if (docs.length > 0) {
                const exerciseDocs = docs.filter(d => /تمرين|exercice|كراس/i.test(d.name));

                if (exerciseDocs.length > 0) {
                    return exerciseDocs.map(d => ({
                        titre: d.name,
                        lien: d.pdf,
                        type: "PDF",
                        pages: d.nombre_page
                    }));
                }
            }

            // ❌ Aucun exercice trouvé
            return {
                message: `📘 تم العثور على كتاب "${manuel.name}" لكن لا يحتوي على تمارين أو فيديوهات مرتبطة حاليًا.`
            };

        } catch (error) {
            console.error("❌ Erreur dans voir_exercices :", error.message);
            return { error: "Erreur lors de la récupération des exercices." };
        }
    }

    ,

    async voir_exercices_intelligent(levelId, matiereName, userMessage = null) {
        try {
            const db = require('../models');
            const { Op } = require('sequelize');

            console.log(`🔍 Traitement de l'intention voir_exercices avec message: "${userMessage}"`);

            // 1. Récupérer les matières correspondantes pour ce niveau
            const materials = await db.Material.findAll({
                attributes: ['id', 'name']
            });

            // Fonction pour normaliser les noms de matières
            const normalize = (s) => s?.trim()?.toLowerCase().replace(/\s/g, '');

            // Mapper les matières avec correspondances
            const matiereMap = {
                'رياضيات': ['رياضيات', 'رياضة', 'math', 'mathématiques'],
                'الإيقاظ العلمي': ['إيقاظ', 'الإيقاظ', 'علوم', 'science', 'éveil'],
                'الفرنسية': ['فرنسية', 'فرنساوي', 'français', 'francais'],
                'العربية': ['عربية', 'عربي', 'arabe']
            };

            let matchingMatiereIds = [];

            // Trouver les IDs des matières correspondantes
            for (const material of materials) {
                for (const [dbLabel, variants] of Object.entries(matiereMap)) {
                    if (variants.some(v => normalize(v) === normalize(matiereName))) {
                        if (normalize(material.name) === normalize(dbLabel)) {
                            matchingMatiereIds.push(material.id);
                        }
                    }
                }
            }

            if (matchingMatiereIds.length === 0) {
                console.log(`⚠️ Aucune matière trouvée pour "${matiereName}"`);
                return {
                    success: false,
                    message: `لم أجد مادة تطابق "${matiereName}". جرب إعادة صياغة اسم المادة.`,
                    messageAr: `لم أجد مادة تطابق "${matiereName}". جرب إعادة صياغة اسم المادة.`,
                    messageFr: `Je n'ai pas trouvé de matière correspondant à "${matiereName}". Essaie de reformuler le nom de la matière.`
                };
            }

            console.log(`✅ Matières trouvées: [${matchingMatiereIds.join(', ')}] pour "${matiereName}"`);

            // 2. Utiliser le service de navigation intelligente
            try {
                const ExerciseNavigationService = require('./ExerciseNavigationService');
                const navigationResult = await ExerciseNavigationService.processVoirExercicesIntention(
                    levelId,
                    matiereName,
                    userMessage,
                    matchingMatiereIds
                );

                if (navigationResult.success) {
                    console.log(`✅ Navigation intelligente réussie`);
                    return {
                        success: true,
                        message: navigationResult.responseAr || navigationResult.response,
                        messageAr: navigationResult.responseAr,
                        messageFr: navigationResult.responseFr,
                        data: navigationResult.data,
                        navigation: navigationResult.navigation,
                        exerciseData: navigationResult.exerciseData
                    };
                } else {
                    console.log(`⚠️ Navigation intelligente n'a pas trouvé de correspondance`);
                    // Continuer avec la logique par défaut
                }
            } catch (navError) {
                console.error('❌ Erreur dans la navigation intelligente:', navError);
                // Continuer avec la logique par défaut
            }

            // 3. Logique par défaut : récupérer tous les exercices disponibles
            try {
                // Mapping des niveaux vers material_ids (même logique que manuelService.js)
                const manualLevelMapping = {
                    6: [1, 1, 2],
                    7: [3, 4, 4],
                    8: [5, 5, 6, 7, 7, 8],
                    9: [9, 9, 10, 11, 11, 12, 12],
                    10: [13, 14, 14, 15, 16, 16, 17, 17],
                    11: [18, 18, 19, 20, 21, 21, 22, 22, 23]
                };

                const levelMaterialIds = manualLevelMapping[levelId];
                if (!levelMaterialIds) {
                    console.log(`⚠️ Niveau ${levelId} non supporté`);
                    return {
                        success: false,
                        message: `مستوى غير مدعوم: ${levelId}`,
                        messageAr: `مستوى غير مدعوم: ${levelId}`,
                        messageFr: `Niveau non supporté: ${levelId}`
                    };
                }

                // Intersection entre les matières du niveau et les matières demandées
                const targetMaterialIds = levelMaterialIds.filter(id => matchingMatiereIds.includes(id));

                if (targetMaterialIds.length === 0) {
                    console.log(`⚠️ Aucune matière correspondante pour niveau ${levelId}`);
                    return {
                        success: false,
                        message: `للأسف، لم نجد تمارين متاحة في ${matiereName} للمستوى المحدد.`,
                        messageAr: `للأسف، لم نجد تمارين متاحة في ${matiereName} للمستوى المحدد.`,
                        messageFr: `Désolé, nous n'avons pas trouvé d'exercices disponibles en ${matiereName} pour le niveau spécifié.`
                    };
                }

                console.log(`🔄 Niveau ${levelId} -> material_ids [${targetMaterialIds.join(', ')}]`);

                // Récupérer tous les manuels pour ces material_ids
                const manuels = await db.Manuel.findAll({
                    where: {
                        material_id: { [Op.in]: targetMaterialIds }
                    },
                    attributes: ['id', 'name', 'material_id', 'logo'],
                    include: [
                        {
                            model: db.Material,
                            as: 'material',
                            attributes: ['id', 'name']
                        }
                    ]
                });

                if (manuels.length === 0) {
                    return {
                        success: false,
                        message: `للأسف، لم نجد تمارين متاحة في ${matiereName} للمستوى المحدد.`,
                        messageAr: `للأسف، لم نجد تمارين متاحة في ${matiereName} للمستوى المحدد.`,
                        messageFr: `Désolé, nous n'avons pas trouvé d'exercices disponibles en ${matiereName} pour le niveau spécifié.`
                    };
                }

                const manuelIds = manuels.map(m => m.id);

                // Récupérer tous les exercices (vidéos) pour ces manuels
                const allExercises = await db.Video.findAll({
                    where: {
                        manuel_id: { [Op.in]: manuelIds },
                        status: 'APPROVED'
                    },
                    attributes: [
                        'id', 'titre', 'video', 'page', 'numero', 'description',
                        'manuel_id', 'thumbnail', 'user_id', 'vues', 'likes',
                        'titleAll', 'status', 'total_minutes_watched'
                    ],
                    include: [
                        {
                            model: db.User,
                            as: 'teacher',
                            attributes: ['id', 'full_name', 'avatar']
                        },
                        {
                            model: db.Manuel,
                            as: 'manuel',
                            attributes: ['id', 'name']
                        }
                    ],
                    order: [['page', 'ASC'], ['numero', 'ASC']]
                });

                if (allExercises.length === 0) {
                    return {
                        success: false,
                        message: `للأسف، لم نجد تمارين متاحة في ${matiereName} للمستوى المحدد.`,
                        messageAr: `للأسف، لم نجد تمارين متاحة في ${matiereName} للمستوى المحدد.`,
                        messageFr: `Désolé, nous n'avons pas trouvé d'exercices disponibles en ${matiereName} pour le niveau spécifié.`
                    };
                }

                const formattedExercises = allExercises.map(exercise => ({
                    id: exercise.id,
                    title: exercise.titre || exercise.titleAll || `تمرين ${exercise.numero || ''} صفحة ${exercise.page || ''}`.trim() || 'تمرين بدون عنوان',
                    page: exercise.page,
                    numero: exercise.numero,
                    manuel: exercise.manuel?.name || 'كتاب غير معروف',
                    teacher: exercise.teacher?.full_name || 'مدرس غير معروف',
                    thumbnail: exercise.thumbnail
                }));

                return {
                    success: true,
                    message: `لدينا ${formattedExercises.length} تمارين متاحة في ${matiereName}. إليك القائمة:`,
                    messageAr: `لدينا ${formattedExercises.length} تمارين متاحة في ${matiereName}. إليك القائمة:`,
                    messageFr: `Nous avons ${formattedExercises.length} exercices disponibles en ${matiereName}. Les voici:`,
                    data: {
                        exercises: formattedExercises
                    }
                };
            } catch (dbError) {
                console.error('❌ Erreur lors de la recherche des exercices disponibles:', dbError);
                return {
                    success: false,
                    message: 'عذراً، حدث خطأ أثناء البحث عن التمارين.',
                    messageAr: 'عذراً، حدث خطأ أثناء البحث عن التمارين.',
                    messageFr: 'Désolé, une erreur est survenue lors de la recherche des exercices.'
                };
            }
        } catch (error) {
            console.error('❌ Erreur dans voir_exercices_intelligent:', error);
            return {
                success: false,
                message: 'عذراً، حدث خطأ أثناء البحث عن التمارين.',
                messageAr: 'عذراً، حدث خطأ أثناء البحث عن التمارين.',
                messageFr: 'Désolé, une erreur est survenue lors de la recherche des exercices.'
            };
        }
    },

    async voir_exercice(levelId, matiereName, userMessage = null, entities = {}) {
        try {
            const db = require('../models');
            const { Op } = require('sequelize');

            console.log(`🔍 Traitement de l'intention voir_exercice avec message: "${userMessage}"`);
            console.log('📋 Entités extraites:', entities);

            const { numero_exercice, nom_exercice, page, manuelName } = entities;

            // 1. Construire les conditions de recherche avec Sequelize
            let whereConditions = {
                status: 'APPROVED'
            };

            // Ajouter les conditions de recherche basées sur les entités
            if (numero_exercice && numero_exercice.toString().trim()) {
                console.log('🔍 Ajout condition numero_exercice:', numero_exercice);
                whereConditions[Op.or] = [
                    { titleAll: { [Op.like]: `%تمرين ${numero_exercice}%` } },
                    { titleAll: { [Op.like]: `%التمرين ${numero_exercice}%` } }
                ];
            }

            if (nom_exercice && nom_exercice.toString().trim()) {
                console.log('🔍 Ajout condition nom_exercice:', nom_exercice);
                whereConditions.titleAll = { [Op.like]: `%${nom_exercice}%` };
            }

            // Utiliser directement la colonne page pour une recherche précise
            if (page) {
                console.log('🔍 Ajout condition page:', page);
                whereConditions.page = page;
            }

            // Si aucune entité spécifique n'est fournie, essayer d'extraire du message utilisateur
            if (!numero_exercice && !nom_exercice && !page && userMessage) {
                // Recherche de patterns dans le message utilisateur
                const exerciseNumberMatch = userMessage.match(/(?:تمرين|التمرين|exercice)\s*(\d+)/i);
                const pageNumberMatch = userMessage.match(/(?:صفحة|ص|page)\s*(\d+)/i);

                if (exerciseNumberMatch) {
                    const extractedNumber = exerciseNumberMatch[1];
                    whereConditions[Op.or] = [
                        { titleAll: { [Op.like]: `%تمرين ${extractedNumber}%` } },
                        { titleAll: { [Op.like]: `%التمرين ${extractedNumber}%` } }
                    ];
                }

                if (pageNumberMatch) {
                    const extractedPage = parseInt(pageNumberMatch[1]);
                    // Utiliser directement la colonne page pour une recherche précise
                    whereConditions.page = extractedPage;
                }
            }

            // Debug: Afficher les valeurs des entités
            console.log('🔍 Debug entités:', {
                numero_exercice,
                nom_exercice,
                page,
                userMessage
            });

            if (Object.keys(whereConditions).length === 0) {
                return {
                    success: false,
                    action: 'ERROR_MESSAGE',
                    message: 'لم أتمكن من فهم التمرين المطلوب. يرجى تحديد رقم التمرين أو اسمه مع رقم الصفحة.',
                    messageAr: 'لم أتمكن من فهم التمرين المطلوب. يرجى تحديد رقم التمرين أو اسمه مع رقم الصفحة.',
                    messageFr: 'Je n\'ai pas pu comprendre l\'exercice demandé. Veuillez spécifier le numéro ou le nom de l\'exercice avec le numéro de page.'
                };
            }

            // 2. Construire la requête avec Sequelize
            let includeConditions = [
                {
                    model: db.Manuel,
                    as: 'manuel',
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: db.Material,
                            as: 'material',
                            attributes: ['id', 'name'],
                            where: {}
                        }
                    ]
                },
                {
                    model: db.User,
                    as: 'teacher',
                    attributes: ['id', 'full_name', 'avatar'],
                    required: false
                }
            ];

            // Ajouter les filtres par matière et manuel si spécifiés
            if (matiereName) {
                includeConditions[0].include[0].where.name = { [Op.like]: `%${matiereName}%` };
            }

            if (manuelName) {
                // Recherche flexible pour les noms de manuels
                // "كتاب الرياضيات" peut correspondre à "رياضيات" ou "كتاب الرياضيات"
                const manuelSearchTerms = [];

                if (manuelName.includes('كتاب')) {
                    // Si le nom contient "كتاب", chercher aussi sans "كتاب" et sans "ال"
                    let withoutKitab = manuelName.replace(/كتاب\s*/g, '').trim();

                    // Enlever aussi "ال" du début si présent
                    if (withoutKitab.startsWith('ال')) {
                        withoutKitab = withoutKitab.substring(2);
                    }

                    if (withoutKitab) {
                        manuelSearchTerms.push({ name: { [Op.like]: `%${withoutKitab}%` } });
                        console.log('🔍 Recherche manuel sans كتاب:', withoutKitab);
                    }
                }

                // Ajouter la recherche avec le nom complet
                manuelSearchTerms.push({ name: { [Op.like]: `%${manuelName}%` } });

                includeConditions[0].where = {
                    [Op.or]: manuelSearchTerms
                };

                console.log('🔍 Conditions de recherche manuel:', JSON.stringify(includeConditions[0].where, null, 2));
            }

            console.log('🔍 Conditions de recherche:', JSON.stringify(whereConditions, null, 2));

            const results = await db.Video.findAll({
                where: whereConditions,
                include: includeConditions,
                attributes: ['id', 'titleAll', 'page', 'video', 'thumbnail'],
                order: [['page', 'ASC'], ['id', 'ASC']],
                limit: 10
            });

            if (!results || results.length === 0) {
                return {
                    success: false,
                    action: 'ERROR_MESSAGE',
                    message: 'لم أجد التمرين المطلوب. تأكد من رقم التمرين ورقم الصفحة.',
                    messageAr: 'لم أجد التمرين المطلوب. تأكد من رقم التمرين ورقم الصفحة.',
                    messageFr: 'Je n\'ai pas trouvé l\'exercice demandé. Vérifiez le numéro de l\'exercice et le numéro de page.'
                };
            }

            // 3. Si un seul exercice trouvé, navigation directe
            if (results.length === 1) {
                const exercise = results[0];

                // Préparer les informations du professeur
                let teacherInfo = null;
                if (exercise.teacher) {
                    // Récupérer le nombre de followers
                    const followersCount = await db.Follow.count({
                        where: {
                            user_id: exercise.teacher.id,
                            status: 'accepted'
                        }
                    });

                    teacherInfo = {
                        id: exercise.teacher.id,
                        full_name: exercise.teacher.full_name,
                        avatar: exercise.teacher.avatar,
                        followers_count: followersCount
                    };
                }

                return {
                    success: true,
                    action: 'NAVIGATE_TO_EXERCISE',
                    payload: {
                        videoId: exercise.id,
                        title: exercise.titleAll,
                        page: exercise.page,
                        videoUrl: exercise.video,
                        thumbnail: exercise.thumbnail,
                        manuelName: exercise.manuel?.name,
                        matiereName: exercise.manuel?.material?.name,
                        teacher: teacherInfo
                    },
                    message: `وجدت التمرين! سأعرضه لك الآن مباشرة.`,
                    messageAr: `وجدت التمرين! سأعرضه لك الآن مباشرة.`,
                    messageFr: `J'ai trouvé l'exercice! Je vais l'afficher tout de suite.`
                };
            }

            // 4. Si plusieurs exercices trouvés, afficher la liste pour sélection
            return {
                success: true,
                action: 'SHOW_EXERCISES_LIST',
                payload: {
                    exercises: results.map(ex => ({
                        videoId: ex.id,
                        title: ex.titleAll,
                        page: ex.page,
                        videoUrl: ex.video,
                        thumbnail: ex.thumbnail,
                        manuelName: ex.manuel?.name,
                        matiereName: ex.manuel?.material?.name
                    }))
                },
                message: `تم العثور على ${results.length} تمارين مطابقة. اختر التمرين المطلوب:`,
                messageAr: `تم العثور على ${results.length} تمارين مطابقة. اختر التمرين المطلوب:`,
                messageFr: `${results.length} exercices trouvés. Choisissez l'exercice souhaité:`
            };

        } catch (error) {
            console.error('❌ Erreur dans voir_exercice:', error);
            return {
                success: false,
                action: 'ERROR_MESSAGE',
                message: 'عذراً، حدث خطأ أثناء البحث عن التمرين.',
                messageAr: 'عذراً، حدث خطأ أثناء البحث عن التمرين.',
                messageFr: 'Désolé, une erreur est survenue lors de la recherche de l\'exercice.'
            };
        }
    },

    async voir_meets(levelId, userMessage = null, entities = {}) {
        try {
            console.log(`🔍 Traitement de l'intention voir_meets avec message: "${userMessage}"`);
            console.log('📋 Entités reçues:', entities);

            // Préparer les filtres basés sur les entités extraites
            const filters = {};

            // Filtrage par matière si spécifiée
            if (entities.matiere) {
                const db = require('../models');

                // 🔍 Obtenir les matiere_id possibles pour ce niveau
                const matiereIds = manualLevelMapping[levelId] || [];

                // Chercher la matière dans les IDs autorisés pour ce niveau
                const material = await db.Material.findOne({
                    where: {
                        name: entities.matiere,
                        id: { [db.Sequelize.Op.in]: matiereIds }
                    }
                });

                if (material) {
                    filters.matiereId = material.id;
                    console.log(`🎯 Filtrage par matière: ${entities.matiere} (ID: ${material.id}) pour niveau ${levelId}`);
                } else {
                    console.log(`⚠️ Matière "${entities.matiere}" non trouvée pour le niveau ${levelId}. IDs autorisés: [${matiereIds.join(', ')}]`);
                }
            }

            // Filtrage par professeur si spécifié
            if (entities.teacherFirstName || entities.teacherLastName) {
                const db = require('../models');
                const { findBestTeacherName } = require('./teacherFinder');

                // Récupérer tous les professeurs
                const allTeachers = await db.User.findAll({
                    where: { role_id: 4 },
                    attributes: ['id', 'full_name']
                });

                // Trouver le meilleur match pour le nom du professeur
                const chosenFullName = await findBestTeacherName(
                    entities.teacherFirstName,
                    entities.teacherLastName,
                    allTeachers
                );

                if (chosenFullName) {
                    const teacher = allTeachers.find(t => t.full_name === chosenFullName);
                    if (teacher) {
                        filters.teacherId = teacher.id;
                        console.log(`🎯 Filtrage par professeur: ${chosenFullName} (ID: ${teacher.id})`);
                    }
                }
            }

            const allMeetings = await MeetingService.getMeetingsByLevel(levelId, filters);

            if (!allMeetings || allMeetings.length === 0) {
                // Personnaliser le message selon les filtres appliqués
                let noMeetingsMessage = '📭 لا توجد لقاءات مباشرة';

                if (filters.teacherId && filters.matiereId) {
                    noMeetingsMessage += ` مع الأستاذ المطلوب في مادة ${entities.matiere}`;
                } else if (filters.teacherId) {
                    noMeetingsMessage += ' مع الأستاذ المطلوب';
                } else if (filters.matiereId) {
                    noMeetingsMessage += ` في مادة ${entities.matiere}`;
                } else {
                    noMeetingsMessage += ' حالياً لمستواك';
                }

                noMeetingsMessage += '. تابعنا بانتظام، سيتم إضافة لقاءات جديدة قريبًا إن شاء الله !';

                return {
                    success: false,
                    action: 'TEXT_MESSAGE',
                    message: noMeetingsMessage,
                    messageAr: noMeetingsMessage,
                    messageFr: 'Aucune session en direct disponible selon vos critères.'
                };
            }

            // Filtrer les meetings pour ne garder que ceux d'aujourd'hui et du futur
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Début de la journée
            const todayTimestamp = Math.floor(today.getTime() / 1000);

            const futureMeetings = allMeetings.filter(meeting => {
                const time = meeting.times?.[0];
                if (!time || !time.meet_date) return false;

                // Comparer avec le début de la journée actuelle
                return time.meet_date >= todayTimestamp;
            });

            if (futureMeetings.length === 0) {
                return {
                    success: false,
                    action: 'TEXT_MESSAGE',
                    message: `📭 لا توجد لقاءات مباشرة مجدولة لمستواك اليوم أو في المستقبل. تابعنا بانتظام، سيتم إضافة لقاءات جديدة قريبًا إن شاء الله !`,
                    messageAr: `📭 لا توجد لقاءات مباشرة مجدولة لمستواك اليوم أو في المستقبل. تابعنا بانتظام، سيتم إضافة لقاءات جديدة قريبًا إن شاء الله !`,
                    messageFr: 'Aucune session en direct programmée pour votre niveau aujourd\'hui ou dans le futur.'
                };
            }

            const meetings = futureMeetings;

            // Préparer les données des meetings pour la carte
            const meetingsData = meetings.map(meeting => {
                const time = meeting.times?.[0] || {};

                // Formatage de la date
                const meetDate = time.meet_date
                    ? new Date(time.meet_date * 1000)
                    : null;
                const formattedDate = meetDate
                    ? meetDate.toLocaleDateString('ar-TN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                    : 'غير محدد';

                // Formatage de l'heure
                const startTime = time.start_time
                    ? new Date(time.start_time * 1000)
                    : null;
                const endTime = time.end_time
                    ? new Date(time.end_time * 1000)
                    : null;

                const formattedTime = startTime && endTime
                    ? `${startTime.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })}`
                    : 'غير محدد';

                return {
                    id: meeting.id,
                    teacherId: meeting.teacher_id,
                    teacherName: meeting.teacher?.full_name || 'أستاذ غير معروف',
                    teacherAvatar: meeting.teacher?.avatar || null,
                    subject: time.material?.name || 'مادة غير محددة',
                    subSubject: time.submaterial?.name || null,
                    date: formattedDate,
                    time: formattedTime,
                    rawDate: time.meet_date,
                    rawStartTime: time.start_time,
                    rawEndTime: time.end_time,
                    levelId: time.level_id,
                    maxStudents: time.max_students,
                    minStudents: time.min_students,
                    meetingTimeId: time.id,
                    amount: meeting.amount,
                    discount: meeting.discount,
                    files: meeting.files || [],
                    dayLabel: time.day_label || 'يوم غير محدد'
                };
            });

            // Personnaliser le message selon les filtres appliqués
            let successMessage = `🎉 رائع! وجدت ${meetings.length} لقاء مباشر`;

            if (filters.teacherId && filters.matiereId) {
                successMessage += ` مع الأستاذ المطلوب في مادة ${entities.matiere}`;
            } else if (filters.teacherId) {
                successMessage += ' مع الأستاذ المطلوب';
            } else if (filters.matiereId) {
                successMessage += ` في مادة ${entities.matiere}`;
            } else {
                successMessage += ' متاح لمستواك';
            }

            successMessage += '. اختر اللقاء الذي يناسبك لمشاهدة التفاصيل والحجز!';

            return {
                success: true,
                action: 'SHOW_MEETING_LIST',
                message: successMessage,
                messageAr: successMessage,
                messageFr: `Génial! J'ai trouvé ${meetings.length} session(s) en direct disponible(s) selon vos critères.`,
                payload: {
                    meetings: meetingsData,
                    totalCount: meetings.length,
                    filters: {
                        teacher: filters.teacherId ? entities.teacherFirstName + ' ' + entities.teacherLastName : null,
                        matiere: filters.matiereId ? entities.matiere : null
                    }
                }
            };

        } catch (error) {
            console.error('❌ Erreur dans voir_meets:', error);
            return {
                success: false,
                action: 'ERROR_MESSAGE',
                message: 'عذراً، حدث خطأ أثناء البحث عن اللقاءات المباشرة.',
                messageAr: 'عذراً، حدث خطأ أثناء البحث عن اللقاءات المباشرة.',
                messageFr: 'Désolé, une erreur est survenue lors de la recherche des sessions en direct.'
            };
        }
    }
    ,

    async abonnement_prof(follower, user_id) {
        try {
            const result = await FollowService.subscribe(follower, user_id);
            console.log("✅ Résultat abonnement :", result);
            return result;
        } catch (error) {
            console.error("❌ Erreur dans abonnement_prof :", error.message);
            throw error;
        }
    },

    async abonnement_platforme(userId) {
        try {
            const user = await userService.getLoggedInUser(userId);
            if (!user) {
                return { error: "Utilisateur introuvable" };
            }

            // Afficher seulement l'offre "الكرطابلة" qui est disponible dans SubscriptionScreen
            const kartablaOffer = {
                id: 3,
                name: "عرض الكرطابلة - إشتراك كامل في الكتب المدرسية",
                price: 80,
                oldPrice: 120,
                days: 365,
                usable_count: null,
                level_id: null,
                description: "اشتراك كامل للوصول إلى جميع الكتب المدرسية والدروس التفاعلية"
            };

            // Générer une réponse appropriée
            const chatbot_response = `مرحباً! لدينا عرض رائع لك في منصة أبجيم! 🎓✨\n\n📚 عرض الكرطابلة - اشتراك كامل للكتب المدرسية\n💰 السعر: 80 د.ت بدلاً من 120 د.ت\n⏰ صالح لمدة سنة كاملة\n\nاضغط على "اشترك الآن" للاستفادة من هذا العرض المميز! 🌟`;

            return {
                action: "show_subscription_offers",
                payload: {
                    offers: [kartablaOffer],
                    navigation: {
                        screen: "SubscriptionScreen",
                        params: {}
                    }
                },
                chatbot_response: chatbot_response
            };
        } catch (error) {
            console.error("❌ Erreur dans abonnement_platforme :", error.message);
            return {
                error: "حدث خطأ أثناء جلب عروض الاشتراك",
                chatbot_response: "عذراً، حدث خطأ أثناء جلب عروض الاشتراك. يرجى المحاولة مرة أخرى."
            };
        }
    },
    async voir_manuels(levelId) {
        return await manuelService.getManuelsByLevel(levelId);
    },

    /**
     * 📖 Nouvelle intention pour voir une page spécifique d'un manuel
     * @param {number} userId - ID de l'utilisateur
     * @param {string} userMessage - Message de l'utilisateur
     * @param {number} levelId - Niveau scolaire de l'utilisateur
     * @param {Object} entities - Entités extraites (page, manuelName, matiere)
     */
    async voir_manuel(userId, userMessage, levelId, entities = {}) {
        try {
            const { page, manuelName, matiere } = entities;

            console.log(`🔍 Traitement voir_manuel - Page: ${page}, Manuel: ${manuelName}, Matière: ${matiere}`);

            // 1. Récupérer tous les manuels du niveau
            const manuels = await manuelService.getManuelsByLevel(levelId);

            if (!manuels || manuels.length === 0) {
                return {
                    error: "لا توجد كتب متاحة لمستواك الدراسي",
                    chatbot_response: "عذراً، لا توجد كتب متاحة حالياً لمستواك الدراسي. 📚"
                };
            }

            // 2. Trouver le manuel correspondant
            let manuelTrouve = null;

            if (manuelName) {
                // Recherche par nom de manuel
                manuelTrouve = findClosestManuel(manuels, manuelName);
            } else if (matiere) {
                // Recherche par matière
                manuelTrouve = manuels.find(m =>
                    m.material?.name?.toLowerCase().includes(matiere.toLowerCase()) ||
                    matiere.toLowerCase().includes(m.material?.name?.toLowerCase())
                );
            }

            if (!manuelTrouve) {
                const suggestions = manuels.map(m => `📘 ${m.name} (${m.material?.name || 'بدون مادة'})`).join('\n');
                return {
                    error: "لم أجد الكتاب المطلوب",
                    chatbot_response: `عذراً، لم أجد الكتاب المطلوب. الكتب المتاحة لمستواك:\n\n${suggestions}`,
                    suggestions: manuels
                };
            }

            console.log(`📘 Manuel trouvé: ${manuelTrouve.name} (ID: ${manuelTrouve.id})`);

            // 3. Récupérer les documents du manuel
            const documents = await manuelService.getDocumentsByManuel(manuelTrouve.id);

            if (!documents || documents.length === 0) {
                return {
                    error: "لا توجد ملفات مرتبطة بهذا الكتاب",
                    chatbot_response: `عذراً، لا توجد ملفات مرتبطة بكتاب "${manuelTrouve.name}" حالياً. 📄`
                };
            }

            // 4. Si une page est spécifiée, vérifier son existence
            if (page && !isNaN(page)) {
                const pageNumber = parseInt(page);

                // Trouver le document qui contient cette page
                const documentAvecPage = documents.find(doc =>
                    doc.nombre_page && pageNumber <= doc.nombre_page
                );

                if (!documentAvecPage) {
                    const maxPages = Math.max(...documents.map(doc => doc.nombre_page || 0));
                    return {
                        error: "الصفحة غير موجودة",
                        chatbot_response: `عذراً، الصفحة ${pageNumber} غير موجودة في كتاب "${manuelTrouve.name}". العدد الأقصى للصفحات هو ${maxPages}. 📄`
                    };
                }

                // Page trouvée - préparer la navigation
                const navigationUrl = documentAvecPage.pathenfant || documentAvecPage.pdf;

                return {
                    action: "navigate_to_manuel_page",
                    payload: {
                        manuel: {
                            id: manuelTrouve.id,
                            name: manuelTrouve.name,
                            material: manuelTrouve.material?.name,
                            logo: manuelTrouve.logo
                        },
                        document: {
                            id: documentAvecPage.id,
                            name: documentAvecPage.name,
                            url: navigationUrl,
                            totalPages: documentAvecPage.nombre_page
                        },
                        page: pageNumber,
                        navigation: {
                            screen: "DocumentScreen",
                            params: {
                                documentUrl: {
                                    id: manuelTrouve.id,
                                    name: manuelTrouve.name,
                                    pathenfant: navigationUrl,
                                    initialPage: pageNumber
                                },
                                title: `${manuelTrouve.name} - صفحة ${pageNumber}`
                            }
                        }
                    },
                    chatbot_response: `ممتاز! سأعرض لك الصفحة ${pageNumber} من كتاب "${manuelTrouve.name}". 📖✨`
                };
            } else {
                // Aucune page spécifiée - afficher les informations du manuel
                const totalPages = documents.reduce((sum, doc) => sum + (doc.nombre_page || 0), 0);

                return {
                    action: "show_manuel_info",
                    payload: {
                        manuel: {
                            id: manuelTrouve.id,
                            name: manuelTrouve.name,
                            material: manuelTrouve.material?.name,
                            logo: manuelTrouve.logo
                        },
                        documents: documents.map(doc => ({
                            id: doc.id,
                            name: doc.name,
                            pages: doc.nombre_page,
                            url: doc.pathenfant || doc.pdf
                        })),
                        totalPages: totalPages,
                        navigation: {
                            screen: "ManuelDetail",
                            params: {
                                manuelId: manuelTrouve.id,
                                manuelName: manuelTrouve.name
                            }
                        }
                    },
                    chatbot_response: `إليك معلومات كتاب "${manuelTrouve.name}"! 📚\n\nالمادة: ${manuelTrouve.material?.name || 'غير محدد'}\nعدد الصفحات: ${totalPages}\n\nيمكنك أن تطلب مني عرض صفحة معينة بقول "أريد أن أرى الصفحة رقم X".`
                };
            }

        } catch (error) {
            console.error('❌ Erreur dans voir_manuel:', error);
            return {
                error: "حدث خطأ أثناء البحث عن الكتاب",
                chatbot_response: "عذراً، حدث خطأ أثناء البحث عن الكتاب. يرجى المحاولة مرة أخرى."
            };
        }
    },
    async voir_details_manuel(userId, userMessage, levelId) {
        const manuels = await manuelService.getManuelsByLevel(levelId);
        if (!manuels || manuels.length === 0) {
            return { message: `❌ لا توجد كتب متاحة حاليًا للمستوى ${levelId}.` };
        }

        const manuelName = await getBestManuelName(userMessage, manuels);
        const manuelTrouve = manuels.find(m => m.name === manuelName);

        if (!manuelTrouve) {
            return {
                message: `❌ لم أتمكن من العثور على الكتاب المطلوب في مستواك.`,
                suggestions: manuels.map(m => `📘 ${m.name}`).join('\n')
            };
        }

        // ✅ Récupérer les documents liés
        const documents = await manuelService.getDocumentsByManuel(manuelTrouve.id);

        if (!documents || documents.length === 0) {
            return {
                titre: manuelTrouve.name,
                couverture: manuelTrouve.logo ? `🖼️ الغلاف: ${manuelTrouve.logo}` : "❌ لا توجد صورة متاحة",
                contenu: "⚠️ لا توجد ملفات مرتبطة بهذا الكتاب حاليًا."
            };
        }

        const docsFormatted = documents.map(doc => `
      📘 ${doc.name}
      📄 عدد الصفحات: ${doc.nombre_page}
      📎 الرابط: ${doc.pdf}
      🧒 نسخة ثلاثية الأبعاد (تلميذ): ${doc["pathenfant"] || "❌ غير متوفرة"}
      `).join("\n\n");

        return {
            titre: manuelTrouve.name,
            couverture: manuelTrouve.logo ? `🖼️ الغلاف: ${manuelTrouve.logo}` : "❌ لا توجد صورة متاحة",
            contenu: docsFormatted
        };
    },

    async voir_profil_prof(teacherId) {
        try {
            const db = require('../models');

            // Récupérer les informations de base du professeur
            const teacher = await TeacherService.getTeacherById(teacherId);

            if (!teacher) {
                return null;
            }

            // Enrichir avec le nombre de cours (webinars)
            const webinarCount = await db.Webinar.count({
                where: { teacher_id: teacherId }
            });

            // Enrichir avec le nombre d'exercices (videos)
            const exerciseCount = await db.Video.count({
                where: { user_id: teacherId }
            });

            // Trouver la matière principale du professeur
            const profMatiereWebinar = await db.Webinar.findOne({
                where: { teacher_id: teacherId },
                include: [{
                    model: db.Material,
                    as: 'material',
                    attributes: ['id', 'name']
                }],
                order: [['created_at', 'DESC']]
            });

            let profMatiere = null;
            if (profMatiereWebinar?.material) {
                profMatiere = profMatiereWebinar.material.name;
            }

            // Enrichir les données du professeur
            const enrichedTeacher = {
                ...teacher.toJSON(),
                webinarCount,
                exerciseCount,
                mainSubject: profMatiere || "مادة غير محددة"
            };

            console.log(`✅ Profil professeur enrichi: ${teacher.full_name} - ${webinarCount} cours, ${exerciseCount} exercices`);

            return enrichedTeacher;
        } catch (error) {
            console.error('❌ Erreur dans voir_profil_prof:', error.message);
            return null;
        }
    },

    //async voir_quizz() {
    // À personnaliser selon ta logique de quiz
    //return { message: "Voici un quiz à faire" };
    //},

    // async voir_favoris(userId) {
    //     return await LikeService.getFavoriteWebinars(userId);
    // },

    // async voir_videos_manuels(manuelId) {
    //     return await videoService.getVideosByManuelId(manuelId);
    // },

    async notifier_parent(userId, data) {
        return await NotificationService.sendNotification({
            user_id: userId,
            title: data.title,
            message: data.message,
            data: data.payload || {},
        });
    },

    async storytime(preferences) {
        return { story: `Une histoire pour toi qui aime ${preferences.join(", ")}` };
    },

    // async recommander_professeur(levelId) {
    //     const all = await WebinarService.getByLevelId(levelId);
    //     return all.length > 0 ? all[0].teacher : null;
    // },
    async recommander_professeur(userId, matiereName, userMessage = null, history = null) {
        try {
            // Récupérer le niveau de l'utilisateur
            const user = await db.User.findByPk(userId);
            if (!user || !user.level_id) {
                console.error(`❌ Utilisateur ${userId} non trouvé ou sans niveau défini`);
                return null;
            }

            const levelId = user.level_id;
            console.log(`🔍 Recommandation de professeur pour l'utilisateur ${userId}, matière '${matiereName}', niveau ${levelId}`);

            // 📡 Appeler le moteur de recommandation pour obtenir la liste complète
            const teacherList = await RecommendationService.recommendProf(userId, matiereName, levelId, 10);

            if (!teacherList || teacherList.length === 0) {
                console.warn(`⚠️ Aucun professeur trouvé pour l'utilisateur ${userId} (niveau ${levelId}) dans la matière ${matiereName}`);
                return null;
            }
            console.log(`✅ ${teacherList.length} professeurs recommandés trouvés`);

            // 🧾 Enregistrer la recommandation dans l'historique
            const savedRecommendation = await RecommendationHistoryService.saveRecommendation(
                userId,
                'teacher',
                teacherList,
                matiereName,
                levelId
            );

            // 📚 Récupérer l'historique des éléments déjà montrés
            const shownTeachers = await RecommendationHistoryService.getShownItems(userId, 'teacher', 7);
            console.log(`📚 Professeurs déjà montrés: ${shownTeachers.length}`);

            // 🔍 Trouver le prochain professeur à montrer
            const nextTeacher = RecommendationHistoryService.findNextItemToShow(teacherList, shownTeachers);

            if (!nextTeacher) {
                console.warn(`⚠️ Tous les professeurs ont déjà été montrés à l'utilisateur ${userId}`);
                return { noMoreRecommendations: true };
            }

            // ✅ Marquer ce professeur comme montré
            await RecommendationHistoryService.markItemAsShown(
                savedRecommendation.session_request_id,
                nextTeacher.id
            );

            // 🎯 Enrichir les informations du professeur
            const webinarCount = await db.Webinar.count({
                where: { teacher_id: nextTeacher.id }
            });

            const lastCourses = await db.Webinar.findAll({
                where: { teacher_id: nextTeacher.id },
                order: [['created_at', 'DESC']],
                limit: 3
            });

            const courseNames = lastCourses.map(w => (w.slug && w.slug.trim()) ? w.slug : "درس بدون عنوان");

            // Chercher la matière réelle de ce prof
            const profMatiereWebinar = await db.Webinar.findOne({
                where: { teacher_id: nextTeacher.id },
                order: [['created_at', 'DESC']]
            });

            const profMatiereId = profMatiereWebinar?.matiere_id;

            let profMatiere = null;
            if (profMatiereId) {
                const matiere = await db.Material.findByPk(profMatiereId);
                profMatiere = matiere?.name || "مادة غير محددة";
            }

            const enrichedTeacher = {
                ...nextTeacher,
                webinarCount,
                lastCourses: courseNames,
                realMatiere: profMatiere
            };

            // 📊 Calculer la position dans la liste
            const currentPosition = shownTeachers.length + 1;
            const totalAvailable = teacherList.length;

            console.log(`✅ Professeur recommandé: ${enrichedTeacher.name} (${currentPosition}/${totalAvailable})`);

            return {
                professeur: enrichedTeacher,
                index: currentPosition,
                total: totalAvailable,
                sessionId: savedRecommendation.session_request_id,
                newRecommendationList: teacherList,
                previouslyShownIds: shownTeachers
            };
        } catch (error) {
            logger.error(`❌ Erreur dans recommander_professeur: ${error.message}`);
            logger.error(error.stack);
            return null;
        }
    },

    /**
     * Recommande des exercices pour un enfant basés sur son niveau scolaire
     * @param {number} userId - ID de l'enfant
     * @param {string} matiereName - Nom de la matière
     * @param {string} message - Message de l'utilisateur
     * @param {Array} conversationHistory - Historique de la conversation
     * @param {number} limit - Nombre de recommandations souhaitées
     * @returns {Promise<Object|null>} Objet contenant l'exercice recommandé ou null si aucun exercice trouvé
     */
    async recommander_exercice(userId, matiereName, message = '', conversationHistory = [], limit = 10) {
        try {
            // Récupérer le niveau de l'utilisateur
            const user = await db.User.findByPk(userId);
            if (!user || !user.level_id) {
                console.error(`❌ Utilisateur ${userId} non trouvé ou sans niveau défini`);
                return null;
            }

            const levelId = user.level_id;
            console.log(`🔍 Recommandation d'exercices pour l'utilisateur ${userId}, matière '${matiereName}', niveau ${levelId}`);

            // 📡 Appeler le moteur de recommandation pour obtenir la liste complète
            const response = await RecommendationService.recommendExercisesByManuel(userId, matiereName, levelId, limit);

            if (!response || !response.recommendations || response.recommendations.length === 0) {
                console.warn(`⚠️ Aucun exercice trouvé pour l'utilisateur ${userId} (niveau ${levelId}) dans la matière ${matiereName}`);
                return null;
            }

            const exerciseList = response.recommendations;
            console.log(`✅ ${exerciseList.length} exercices recommandés trouvés`);

            // 🧾 Enregistrer la recommandation dans l'historique
            const savedRecommendation = await RecommendationHistoryService.saveRecommendation(
                userId,
                'exercise',
                exerciseList,
                matiereName,
                levelId
            );

            // 📚 Récupérer l'historique des éléments déjà montrés
            const shownExercises = await RecommendationHistoryService.getShownItems(userId, 'exercise', 7);
            console.log(`📚 Exercices déjà montrés: ${shownExercises.length}`);

            // 🔍 Trouver le prochain exercice à montrer
            const nextExercise = RecommendationHistoryService.findNextItemToShow(exerciseList, shownExercises);

            if (!nextExercise) {
                console.warn(`⚠️ Tous les exercices ont déjà été montrés à l'utilisateur ${userId}`);
                return { noMoreRecommendations: true };
            }

            // ✅ Marquer cet exercice comme montré
            await RecommendationHistoryService.markItemAsShown(
                savedRecommendation.session_request_id,
                nextExercise.id
            );

            // 🎯 Enrichir les informations de l'exercice
            let manuelName = nextExercise.manuel_name;
            let teacherName = nextExercise.teacher_name;

            // Si nous n'avons pas le nom du manuel, le récupérer
            if (!manuelName && nextExercise.manuel_id) {
                try {
                    const manuel = await db.Manuel.findByPk(nextExercise.manuel_id);
                    manuelName = manuel?.name || 'كتاب غير معروف';
                } catch (error) {
                    console.error(`❌ Erreur lors de la récupération du manuel ${nextExercise.manuel_id}: ${error.message}`);
                }
            }

            // Si nous n'avons pas le nom de l'enseignant, le récupérer
            if (!teacherName && nextExercise.teacher_id) {
                try {
                    const teacher = await db.User.findByPk(nextExercise.teacher_id);
                    teacherName = teacher?.full_name || 'مدرس غير معروف';
                } catch (error) {
                    console.error(`❌ Erreur lors de la récupération de l'enseignant ${nextExercise.teacher_id}: ${error.message}`);
                }
            }

            const enrichedExercise = {
                ...nextExercise,
                manuel_name: manuelName,
                teacher_name: teacherName,
                // Conserver les informations complètes du professeur si elles existent
                teacher: nextExercise.teacher || {
                    id: nextExercise.teacher_id || nextExercise.user_id,
                    name: teacherName,
                    full_name: teacherName,
                    avatar: nextExercise.teacher_avatar || null
                }
            };

            // 📊 Calculer la position dans la liste
            const currentPosition = shownExercises.length + 1;
            const totalAvailable = exerciseList.length;

            console.log(`✅ Exercice recommandé: ${enrichedExercise.title || enrichedExercise.titre} (${currentPosition}/${totalAvailable})`);

            return {
                exercise: enrichedExercise,
                index: currentPosition,
                total: totalAvailable,
                sessionId: savedRecommendation.session_request_id,
                newRecommendationList: exerciseList,
                previouslyShownIds: shownExercises
            };
        } catch (error) {
            console.error(`❌ Erreur dans recommander_exercice: ${error.message}`);
            console.error(error.stack);
            return null;
        }
    },

    /**
     * Recommande des cours pour un enfant
     * @param {number} userId - ID de l'enfant
     * @param {string} matiereName - Nom de la matière
     * @param {string} message - Message de l'utilisateur
     * @param {Array} conversationHistory - Historique de la conversation
     * @param {number} limit - Nombre de recommandations souhaitées
     * @param {number} levelId - ID du niveau (optionnel, sera récupéré depuis l'utilisateur si non fourni)
     * @returns {Promise<Object|null>} Objet contenant le cours recommandé ou null si aucun cours trouvé
     */
    async recommander_cours(userId, matiereName, message = '', conversationHistory = [], limit = 5, levelId = null) {
        try {
            // Vérifier que l'utilisateur existe
            const user = await db.User.findByPk(userId);
            if (!user) {
                console.error(`❌ Utilisateur ${userId} non trouvé`);
                return null;
            }

            // Si levelId n'est pas fourni, utiliser le niveau de l'utilisateur
            if (!levelId) {
                if (!user.level_id) {
                    console.error(`❌ Utilisateur ${userId} n'a pas de niveau défini`);
                    return null;
                }
                levelId = user.level_id;
            }

            console.log(`🔍 Recommandation de cours pour l'utilisateur ${userId}, matière '${matiereName}', niveau ${levelId}`);

            // 📡 Appeler le moteur de recommandation pour obtenir la liste complète
            const response = await RecommendationService.recommendCourses(userId, matiereName, levelId, limit);

            if (!response || !response.recommendations || response.recommendations.length === 0) {
                console.warn(`⚠️ Aucun cours trouvé pour l'utilisateur ${userId} (niveau ${levelId}) dans la matière ${matiereName}`);
                return null;
            }

            const courseList = response.recommendations;
            console.log(`✅ ${courseList.length} cours recommandés trouvés`);

            // 🧾 Enregistrer la recommandation dans l'historique
            const savedRecommendation = await RecommendationHistoryService.saveRecommendation(
                userId,
                'course',
                courseList,
                matiereName,
                levelId
            );

            // 📚 Récupérer l'historique des éléments déjà montrés
            const shownCourses = await RecommendationHistoryService.getShownItems(userId, 'course', 7);
            console.log(`📚 Cours déjà montrés: ${shownCourses.length}`);

            // 🔍 Trouver le prochain cours à montrer
            const nextCourse = RecommendationHistoryService.findNextItemToShow(courseList, shownCourses);

            if (!nextCourse) {
                console.warn(`⚠️ Tous les cours ont déjà été montrés à l'utilisateur ${userId}`);
                return { noMoreRecommendations: true };
            }

            // ✅ Marquer ce cours comme montré
            await RecommendationHistoryService.markItemAsShown(
                savedRecommendation.session_request_id,
                nextCourse.id
            );

            // 🎯 Enrichir les informations du cours
            let teacherInfo = nextCourse.teacher || {};

            // Si nous n'avons pas toutes les informations sur l'enseignant, les récupérer
            if (nextCourse.teacher && nextCourse.teacher.id && (!nextCourse.teacher.name || !nextCourse.teacher.avatar)) {
                try {
                    const teacher = await db.User.findByPk(nextCourse.teacher.id);
                    if (teacher) {
                        teacherInfo = {
                            id: teacher.id,
                            name: teacher.full_name || 'مدرس غير معروف',
                            avatar: teacher.avatar || '/default-avatar.jpg'
                        };
                    }
                } catch (error) {
                    console.error(`❌ Erreur lors de la récupération de l'enseignant ${nextCourse.teacher.id}: ${error.message}`);
                }
            }

            const enrichedCourse = {
                ...nextCourse,
                teacher: teacherInfo
            };

            // 📊 Calculer la position dans la liste
            const currentPosition = shownCourses.length + 1;
            const totalAvailable = courseList.length;

            console.log(`✅ Cours recommandé: ${enrichedCourse.title} (${currentPosition}/${totalAvailable})`);

            return {
                course: enrichedCourse,
                index: currentPosition,
                total: totalAvailable,
                sessionId: savedRecommendation.session_request_id,
                newRecommendationList: courseList,
                previouslyShownIds: shownCourses
            };
        } catch (error) {
            console.error(`❌ Erreur dans recommander_cours: ${error.message}`);
            console.error(error.stack);
            return null;
        }
    },

    // async recommander_quizz(levelId) {
    //     return { quiz: `Quiz recommandé pour le niveau ${levelId}` };
    // },

    async question_generale(question) {
        return { answer: `Voici une réponse à ta question : ${question}` };
    },

    async accueil() {
        return { greeting: "👋 Bienvenue sur Abajim ! Comment puis-je t’aider aujourd’hui ?" };
    },

    async aide() {
        return {
            help: "Tu peux me demander : voir un cours, faire un quiz, voir un manuel, t'abonner à un prof, ou même écouter une histoire !"
        };
    },

    async ignorer_contenu() {
        return { message: "Je n'ai pas compris, peux-tu reformuler ?" };
    },

    async autre() {
        return { message: "Je suis là pour t'aider, n'hésite pas à poser une question !" };
    }

};
