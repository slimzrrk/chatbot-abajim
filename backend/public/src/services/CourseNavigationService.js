/**
 * Service de navigation intelligente des cours avec GPT
 * Traite l'intention voir_cours avec correspondance sémantique et navigation
 */

const db = require('../models');
const { OpenAI } = require('openai');
const { Op } = require('sequelize');

// Configuration OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Charge les données complètes des cours avec leurs chapitres et fichiers
 * @param {number} levelId - ID du niveau
 * @param {Array} matiereIds - IDs des matières
 * @returns {Promise<Array>} - Liste des cours avec leurs données complètes
 */
async function loadCompleteCoursesData(levelId, matiereIds) {
    console.log(`📚 Chargement des cours complets pour niveau ${levelId} et matières [${matiereIds.join(', ')}]`);
    
    const courses = await db.Webinar.findAll({
        where: {
            matiere_id: { [Op.in]: matiereIds },
            level_id: levelId,
            status: { [Op.in]: ['active', 'pending'] }, // Inclure pending aussi
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

/**
 * Structure les données des cours pour l'analyse GPT
 * @param {Array} courses - Liste des cours de la base de données
 * @returns {Array} - Données structurées pour GPT
 */
function structureCourseDataForGPT(courses) {
    return courses.map(course => {
        const titleAr = course.WebinarTranslations?.find(t => t.locale === 'ar')?.title || '';
        const titleFr = course.WebinarTranslations?.find(t => t.locale === 'fr')?.title || '';
        const description = course.WebinarTranslations?.find(t => t.locale === 'ar')?.description || 
                          course.WebinarTranslations?.find(t => t.locale === 'fr')?.description || '';
        
        const chapitres = course.chapters?.map(chapter => {
            const fichiers = chapter.files?.map(file => {
                const fileTitleAr = file.translations?.find(t => t.locale === 'ar')?.title || '';
                const fileTitleFr = file.translations?.find(t => t.locale === 'fr')?.title || '';
                const fileDesc = file.translations?.find(t => t.locale === 'ar')?.description || 
                               file.translations?.find(t => t.locale === 'fr')?.description || '';
                
                return {
                    id: file.id,
                    type: file.file_type,
                    titre_ar: fileTitleAr,
                    titre_fr: fileTitleFr,
                    description: fileDesc
                };
            }) || [];
            
            return {
                id: chapter.id,
                ordre: chapter.order,
                fichiers: fichiers
            };
        }) || [];
        
        return {
            id: course.id,
            titre_ar: titleAr,
            titre_fr: titleFr,
            description: description,
            enseignant: course.teacher?.full_name || '',
            chapitres: chapitres
        };
    });
}

/**
 * Utilise GPT pour trouver les cours correspondant au message utilisateur
 * @param {string} userMessage - Message de l'utilisateur
 * @param {Array} structuredCourses - Cours structurés pour GPT
 * @returns {Promise<Object>} - Résultat de l'analyse GPT
 */
async function findMatchingCoursesWithGPT(userMessage, structuredCourses) {
    const prompt = `Tu es un assistant éducatif intelligent spécialisé dans la correspondance de cours. Analyse le message de l'utilisateur et trouve les cours qui correspondent le mieux à sa demande.

MESSAGE UTILISATEUR: "${userMessage}"

COURS DISPONIBLES:
${JSON.stringify(structuredCourses, null, 2)}

INSTRUCTIONS:
1. Compare le message utilisateur avec les titres, descriptions et contenus des cours
2. Recherche des correspondances sémantiques (pas seulement exactes)
3. Considère les synonymes et les termes liés en arabe et français
4. Évalue la pertinence de chaque cours sur une échelle de 0 à 1
5. Retourne UNIQUEMENT un JSON avec cette structure exacte:

{
  "correspondances": [
    {
      "cours_id": 123,
      "score_confiance": 0.95,
      "raison": "Le cours correspond parfaitement car il traite des fractions et l'utilisateur demande un cours sur les fractions"
    }
  ],
  "aucune_correspondance": false
}

Si aucun cours ne correspond (score < 0.3), retourne:
{
  "correspondances": [],
  "aucune_correspondance": true,
  "suggestion": "Aucun cours trouvé correspondant à ta demande. Essaie de reformuler ou demande la liste complète des cours disponibles."
}

IMPORTANT: 
- Retourne UNIQUEMENT le JSON, rien d'autre
- Trie les correspondances par score décroissant
- Inclus seulement les cours avec un score >= 0.3

RÉPONSE (JSON uniquement):`;

    try {
        console.log('🤖 Appel GPT pour correspondance de cours...');
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 1000
        });

        const gptResponse = completion.choices[0].message.content.trim();
        console.log('🤖 Réponse GPT brute:', gptResponse);
        
        // Nettoyer la réponse pour extraire le JSON
        const jsonMatch = gptResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Aucun JSON trouvé dans la réponse GPT');
        }
        
        const cleanedResponse = jsonMatch[0];
        const parsedResponse = JSON.parse(cleanedResponse);
        
        console.log('🤖 Réponse GPT parsée:', JSON.stringify(parsedResponse, null, 2));
        return parsedResponse;
        
    } catch (error) {
        console.error('❌ Erreur GPT:', error);
        return { 
            correspondances: [], 
            aucune_correspondance: true,
            suggestion: "Erreur lors de l'analyse. Essaie de reformuler ta demande."
        };
    }
}

/**
 * Traite l'intention voir_cours avec navigation intelligente
 * @param {number} levelId - ID du niveau
 * @param {string} matiereName - Nom de la matière
 * @param {string} userMessage - Message de l'utilisateur
 * @param {Array} matiereIds - IDs des matières autorisées pour ce niveau
 * @returns {Promise<Object>} - Résultat avec réponse et navigation
 */
async function processVoirCoursIntention(levelId, matiereName, userMessage, matiereIds) {
    try {
        console.log(`🎯 Traitement intention voir_cours: niveau=${levelId}, matière=${matiereName}, message="${userMessage}"`);
        
        // 1. Charger les données complètes des cours
        const courses = await loadCompleteCoursesData(levelId, matiereIds);
        
        if (courses.length === 0) {
            return {
                success: false,
                response: "Aucun cours n'est disponible pour votre niveau actuellement.",
                responseAr: "لا توجد دروس متاحة لمستواك حالياً.",
                responseFr: "Aucun cours n'est disponible pour votre niveau actuellement.",
                navigation: null
            };
        }
        
        // 2. Si pas de message spécifique, retourner tous les cours
        if (!userMessage || userMessage.trim() === "") {
            const courseList = courses.map(course => {
                const title = course.WebinarTranslations?.find(t => t.locale === 'ar')?.title || 
                             course.WebinarTranslations?.find(t => t.locale === 'fr')?.title || 
                             'Cours sans titre';
                return {
                    id: course.id,
                    title: title,
                    teacher: course.teacher?.full_name || 'Enseignant inconnu',
                    image: course.image_cover
                };
            });
            
            return {
                success: true,
                response: `إليك ${courses.length} دروس متاحة لمستواك:`,
                responseAr: `إليك ${courses.length} دروس متاحة لمستواك:`,
                responseFr: `Voici les ${courses.length} cours disponibles pour ton niveau :`,
                data: {
                    courses: courseList,
                    navigation: {
                        screen: 'CourseList',
                        params: {
                            courses: courseList,
                            title: 'Cours disponibles'
                        }
                    }
                }
            };
        }
        
        // 3. Structurer les données pour GPT
        const structuredCourses = structureCourseDataForGPT(courses);
        
        // 4. Utiliser GPT pour trouver les correspondances
        const gptResult = await findMatchingCoursesWithGPT(userMessage, structuredCourses);
        
        // 5. Traiter les résultats
        if (gptResult.aucune_correspondance || !gptResult.correspondances || gptResult.correspondances.length === 0) {
            return {
                success: false,
                response: gptResult.suggestion || "Aucun cours trouvé correspondant à ta demande.",
                responseAr: "لم أجد أي دروس تطابق طلبك. جرب إعادة صياغة السؤال.",
                responseFr: "Aucun cours trouvé correspondant à ta demande. Essaie de reformuler.",
                navigation: null
            };
        }
        
        // 6. Si un seul cours correspond avec un score élevé (>= 0.8), navigation directe
        if (gptResult.correspondances.length === 1 && gptResult.correspondances[0].score_confiance >= 0.8) {
            const matchedCourse = courses.find(c => c.id === gptResult.correspondances[0].cours_id);
            if (matchedCourse) {
                const title = matchedCourse.WebinarTranslations?.find(t => t.locale === 'ar')?.title ||
                             matchedCourse.WebinarTranslations?.find(t => t.locale === 'fr')?.title ||
                             'Cours sans titre';

                // Préparer les données du cours pour la carte
                const courseData = {
                    id: matchedCourse.id,
                    title: title,
                    description: matchedCourse.WebinarTranslations?.find(t => t.locale === 'ar')?.description ||
                                matchedCourse.WebinarTranslations?.find(t => t.locale === 'fr')?.description || '',
                    image_cover: matchedCourse.image_cover,
                    price: matchedCourse.price || 0,
                    duration: matchedCourse.duration,
                    teacher: {
                        id: matchedCourse.teacher?.id,
                        name: matchedCourse.teacher?.full_name,
                        full_name: matchedCourse.teacher?.full_name,
                        avatar: matchedCourse.teacher?.avatar
                    },
                    chapters: matchedCourse.chapters || [],
                    score: gptResult.correspondances[0].score_confiance
                };

                return {
                    success: true,
                    response: `ممتاز! سأوجهك إلى درس "${title}".`,
                    responseAr: `ممتاز! سأوجهك إلى درس "${title}".`,
                    responseFr: `Parfait ! Je t'emmène vers le cours "${title}".`,
                    navigation: {
                        screen: 'WebinarDetailScreen',
                        params: { webinarId: matchedCourse.id }
                    },
                    courseData: courseData
                };
            }
        }
        
        // 7. Plusieurs cours correspondent, proposer une liste
        const matchingCourses = gptResult.correspondances.map(match => {
            const course = courses.find(c => c.id === match.cours_id);
            if (course) {
                const title = course.WebinarTranslations?.find(t => t.locale === 'ar')?.title || 
                             course.WebinarTranslations?.find(t => t.locale === 'fr')?.title || 
                             'Cours sans titre';
                return {
                    id: course.id,
                    title: title,
                    teacher: course.teacher?.full_name || 'Enseignant inconnu',
                    image: course.image_cover,
                    score: match.score_confiance,
                    raison: match.raison
                };
            }
            return null;
        }).filter(Boolean);
        
        return {
            success: true,
            response: `وجدت ${matchingCourses.length} دروس تطابق طلبك. اختر واحداً منها:`,
            responseAr: `وجدت ${matchingCourses.length} دروس تطابق طلبك. اختر واحداً منها:`,
            responseFr: `J'ai trouvé ${matchingCourses.length} cours correspondant à ta demande. Choisis-en un :`,
            data: {
                courses: matchingCourses
            },
            navigation: {
                screen: 'CourseList',
                params: {
                    filteredCourses: matchingCourses,
                    title: 'Cours correspondants',
                    searchQuery: userMessage
                }
            }
        };
        
    } catch (error) {
        console.error('❌ Erreur dans processVoirCoursIntention:', error);
        return {
            success: false,
            response: "Désolé, une erreur s'est produite lors de la recherche des cours.",
            responseAr: "عذراً، حدث خطأ أثناء البحث عن الدروس.",
            responseFr: "Désolé, une erreur s'est produite lors de la recherche des cours.",
            navigation: null
        };
    }
}

module.exports = {
    processVoirCoursIntention,
    loadCompleteCoursesData,
    structureCourseDataForGPT,
    findMatchingCoursesWithGPT
};
