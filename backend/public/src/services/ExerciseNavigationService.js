/**
 * Service de navigation intelligente pour les exercices
 * Traite l'intention voir_exercices avec correspondance sémantique et navigation
 */

const db = require('../models');
const { OpenAI } = require('openai');
const { Op } = require('sequelize');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Charge les données complètes des exercices pour un niveau donné
 * @param {number} levelId - ID du niveau
 * @param {Array} matiereIds - IDs des matières autorisées pour ce niveau
 * @returns {Promise<Array>} - Liste des exercices avec leurs données complètes
 */
async function loadCompleteExercisesData(levelId, matiereIds) {
    try {
        console.log(`📚 Chargement des exercices pour niveau ${levelId}, matières [${matiereIds.join(', ')}]`);

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
            return [];
        }

        // Intersection entre les matières du niveau et les matières demandées
        const targetMaterialIds = levelMaterialIds.filter(id => matiereIds.includes(id));

        if (targetMaterialIds.length === 0) {
            console.log(`⚠️ Aucune matière correspondante pour niveau ${levelId}`);
            return [];
        }

        console.log(`🔄 Niveau ${levelId} -> material_ids du niveau: [${levelMaterialIds.join(', ')}]`);
        console.log(`🎯 Material_ids filtrés pour la matière demandée: [${targetMaterialIds.join(', ')}]`);

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
            console.log('⚠️ Aucun manuel trouvé pour ce niveau et ces matières');
            return [];
        }

        const manuelIds = manuels.map(m => m.id);
        console.log(`📖 ${manuels.length} manuels trouvés: [${manuelIds.join(', ')}]`);

        // Récupérer tous les exercices (vidéos) pour ces manuels
        const exercises = await db.Video.findAll({
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
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: db.Material,
                            as: 'material',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            order: [['page', 'ASC'], ['numero', 'ASC']]
        });

        console.log(`🎯 ${exercises.length} exercices trouvés`);
        return exercises;
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des exercices:', error);
        return [];
    }
}

/**
 * Structure les données des exercices pour l'analyse GPT
 * @param {Array} exercises - Liste des exercices de la base de données
 * @returns {Array} - Données structurées pour GPT
 */
function structureExerciseDataForGPT(exercises) {
    return exercises.map(exercise => {
        return {
            id: exercise.id,
            titre: exercise.titre || exercise.titleAll || `تمرين ${exercise.numero || ''} صفحة ${exercise.page || ''}`.trim() || 'تمرين بدون عنوان',
            description: exercise.description || '',
            page: exercise.page || null,
            numero: exercise.numero || null,
            manuel_name: exercise.manuel?.name || '',
            matiere: exercise.manuel?.material?.name || '',
            enseignant: exercise.teacher?.full_name || ''
        };
    });
}

/**
 * Utilise GPT pour trouver les exercices correspondant au message utilisateur
 * @param {string} userMessage - Message de l'utilisateur
 * @param {Array} structuredExercises - Exercices structurés pour GPT
 * @returns {Promise<Object>} - Résultat de l'analyse GPT
 */
async function findMatchingExercisesWithGPT(userMessage, structuredExercises) {
    const prompt = `Tu es un assistant éducatif intelligent spécialisé dans la correspondance d'exercices. Analyse le message de l'utilisateur et trouve les exercices qui correspondent le mieux à sa demande.

MESSAGE UTILISATEUR: "${userMessage}"

EXERCICES DISPONIBLES:
${JSON.stringify(structuredExercises, null, 2)}

INSTRUCTIONS:
1. Compare le message utilisateur avec les titres, descriptions, pages, numéros et contenus des exercices
2. Recherche des correspondances sémantiques (pas seulement exactes)
3. Considère les synonymes et les termes liés en arabe et français
4. Si l'utilisateur mentionne un numéro d'exercice spécifique, privilégie ce critère
5. Si l'utilisateur mentionne une page spécifique, privilégie les exercices de cette page
6. Évalue la pertinence de chaque exercice sur une échelle de 0 à 1
7. Retourne UNIQUEMENT un JSON avec cette structure exacte:

{
  "correspondances": [
    {
      "exercice_id": 123,
      "score_confiance": 0.95,
      "raison": "L'exercice correspond parfaitement car il s'agit de l'exercice numéro 5 page 12 demandé par l'utilisateur"
    }
  ],
  "aucune_correspondance": false
}

Si aucun exercice ne correspond (score < 0.3), retourne:
{
  "correspondances": [],
  "aucune_correspondance": true,
  "suggestion": "Aucun exercice trouvé correspondant à ta demande. Essaie de préciser le numéro d'exercice ou la page."
}

IMPORTANT: 
- Retourne UNIQUEMENT le JSON, rien d'autre
- Trie les correspondances par score décroissant
- Inclus seulement les exercices avec un score >= 0.3
- Privilégie les correspondances exactes de numéro et page

RÉPONSE (JSON uniquement):`;

    try {
        console.log('🤖 Appel GPT pour correspondance d\'exercices...');
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
 * Traite l'intention voir_exercices avec navigation intelligente
 * @param {number} levelId - ID du niveau
 * @param {string} matiereName - Nom de la matière
 * @param {string} userMessage - Message de l'utilisateur
 * @param {Array} matiereIds - IDs des matières autorisées pour ce niveau
 * @returns {Promise<Object>} - Résultat avec réponse et navigation
 */
async function processVoirExercicesIntention(levelId, matiereName, userMessage, matiereIds) {
    try {
        console.log(`🎯 Traitement intention voir_exercices: niveau=${levelId}, matière=${matiereName}, message="${userMessage}"`);
        
        // 1. Charger les données complètes des exercices
        const exercises = await loadCompleteExercisesData(levelId, matiereIds);
        
        if (exercises.length === 0) {
            return {
                success: false,
                response: "لا توجد تمارين متاحة لمستواك حالياً.",
                responseAr: "لا توجد تمارين متاحة لمستواك حالياً.",
                responseFr: "Aucun exercice n'est disponible pour votre niveau actuellement.",
                navigation: null
            };
        }
        
        // 2. Vérifier d'abord si c'est une recherche par page spécifique
        const pageMatch = userMessage.match(/صفحة\s*(\d+)|page\s*(\d+)|ص\s*(\d+)/i);
        const bookMatch = userMessage.match(/كتاب\s*([^\s]+)|livre\s*([^\s]+)|manuel\s*([^\s]+)/i);

        if (pageMatch) {
            const pageNumber = parseInt(pageMatch[1] || pageMatch[2] || pageMatch[3]);
            console.log(`🔍 Recherche d'exercices pour la page ${pageNumber}`);
            console.log(`📊 Total exercices disponibles: ${exercises.length}`);

            let filteredExercises = exercises.filter(ex => ex.page === pageNumber);
            console.log(`📋 Exercices trouvés pour la page ${pageNumber}: ${filteredExercises.length}`);

            // Afficher les exercices trouvés pour debug
            if (filteredExercises.length > 0) {
                console.log(`📝 Exercices de la page ${pageNumber}:`);
                filteredExercises.forEach((ex, index) => {
                    console.log(`  ${index + 1}. ID: ${ex.id}, Titre: ${ex.titleAll}, Manuel: ${ex.manuel?.name}`);
                });
            }

            // Si un livre spécifique est mentionné, filtrer aussi par livre
            if (bookMatch) {
                const bookName = bookMatch[1] || bookMatch[2] || bookMatch[3];
                console.log(`📖 Filtrage par livre: ${bookName}`);
                console.log(`📖 Recherche du terme "${bookName}" dans les noms de manuels...`);

                const beforeBookFilter = filteredExercises.length;

                // Analyser si l'utilisateur veut un manuel spécifique ou tous les manuels de maths
                const isGeneralMathRequest = (bookName === 'الرياضيات' || bookName === 'رياضيات');
                const isSpecificManualRequest = bookName.length > 10; // Plus de détails = manuel spécifique

                if (isGeneralMathRequest && !isSpecificManualRequest) {
                    console.log(`📚 L'utilisateur demande tous les manuels de mathématiques - pas de filtrage supplémentaire`);
                    // Pas de filtrage supplémentaire car on a déjà tous les exercices de maths
                } else {
                    console.log(`📖 L'utilisateur demande un manuel spécifique: "${bookName}"`);
                    // Filtrer par nom spécifique du manuel
                    filteredExercises = filteredExercises.filter(ex => {
                        const manuelName = ex.manuel?.name?.toLowerCase() || '';
                        const bookNameLower = bookName.toLowerCase();
                        const matches = manuelName.includes(bookNameLower);
                        console.log(`  - Manuel "${ex.manuel?.name}" contient "${bookName}"? ${matches}`);
                        return matches;
                    });
                }
                console.log(`📖 Après filtrage par livre: ${filteredExercises.length} (avant: ${beforeBookFilter})`);
            }

            console.log(`🎯 Exercices finaux filtrés: ${filteredExercises.length}`);

            if (filteredExercises.length > 0) {
                const exerciseList = filteredExercises.map(exercise => {
                    return {
                        id: exercise.id,
                        videoId: exercise.id, // Pour compatibilité avec ExerciseSelectionCard
                        title: exercise.titre || exercise.titleAll || `تمرين ${exercise.numero || ''} صفحة ${exercise.page || ''}`.trim() || 'تمرين بدون عنوان',
                        page: exercise.page,
                        numero: exercise.numero,
                        videoUrl: exercise.video,
                        manuel: exercise.manuel?.name || 'كتاب غير معروف',
                        manuelName: exercise.manuel?.name || 'كتاب غير معروف', // Pour compatibilité
                        teacher: {
                            id: exercise.teacher?.id,
                            full_name: exercise.teacher?.full_name || 'مدرس غير معروف',
                            avatar: exercise.teacher?.avatar,
                            followers_count: exercise.teacher?.followers_count || 0
                        },
                        thumbnail: exercise.thumbnail
                    };
                });

                console.log(`✅ Retour de ${exerciseList.length} exercices filtrés pour la page ${pageNumber}`);

                const result = {
                    success: true,
                    action: 'SHOW_EXERCISES_LIST',
                    payload: {
                        exercises: exerciseList,
                        page: pageNumber,
                        book: bookMatch ? (bookMatch[1] || bookMatch[2] || bookMatch[3]) : null
                    },
                    exerciseCount: exerciseList.length,
                    exercisesList: exerciseList,
                    userMessage: userMessage,
                    matiereName: matiereName,
                    // Message de base qui sera amélioré par GPT
                    message: `وجدت ${exerciseList.length} تمرين في الصفحة ${pageNumber}. اختر التمرين المطلوب:`,
                    messageAr: `وجدت ${exerciseList.length} تمرين في الصفحة ${pageNumber}. اختر التمرين المطلوب:`,
                    messageFr: `J'ai trouvé ${exerciseList.length} exercice(s) à la page ${pageNumber}. Choisis l'exercice souhaité :`
                };

                console.log(`🚀 RETOUR IMMÉDIAT avec ${exerciseList.length} exercices pour la page ${pageNumber}`);
                return result;
            } else {
                console.log(`❌ AUCUN exercice trouvé pour la page ${pageNumber}`);
                return {
                    success: false,
                    message: `لم أجد أي تمارين في الصفحة ${pageNumber}${bookMatch ? ` من كتاب ${bookMatch[1] || bookMatch[2] || bookMatch[3]}` : ''}.`,
                    messageAr: `لم أجد أي تمارين في الصفحة ${pageNumber}${bookMatch ? ` من كتاب ${bookMatch[1] || bookMatch[2] || bookMatch[3]}` : ''}.`,
                    messageFr: `Aucun exercice trouvé à la page ${pageNumber}${bookMatch ? ` du livre ${bookMatch[1] || bookMatch[2] || bookMatch[3]}` : ''}.`
                };
            }
        }

        // 3. Si pas de message spécifique, retourner tous les exercices
        if (!userMessage || userMessage.trim() === "") {
            const exerciseList = exercises.map(exercise => {
                return {
                    id: exercise.id,
                    title: exercise.titre || exercise.titleAll || `تمرين ${exercise.numero || ''} صفحة ${exercise.page || ''}`.trim() || 'تمرين بدون عنوان',
                    page: exercise.page,
                    numero: exercise.numero,
                    videoUrl: exercise.video,
                    manuel: exercise.manuel?.name || 'كتاب غير معروف',
                    teacher: {
                        id: exercise.teacher?.id,
                        full_name: exercise.teacher?.full_name || 'مدرس غير معروف',
                        avatar: exercise.teacher?.avatar,
                        followers_count: exercise.teacher?.followers_count || 0
                    },
                    thumbnail: exercise.thumbnail
                };
            });

            return {
                success: true,
                action: 'SHOW_EXERCISES_LIST',
                payload: {
                    exercises: exerciseList
                },
                exerciseCount: exerciseList.length,
                exercisesList: exerciseList,
                userMessage: userMessage,
                matiereName: matiereName,
                // Message de base qui sera amélioré par GPT
                message: `وجدت ${exerciseList.length} تمرين متاح. اختر التمرين المطلوب:`,
                messageAr: `وجدت ${exerciseList.length} تمرين متاح. اختر التمرين المطلوب:`,
                messageFr: `J'ai trouvé ${exerciseList.length} exercice(s) disponible(s). Choisis l'exercice souhaité :`
            };
        }
        
        // 3. Structurer les données pour GPT
        const structuredExercises = structureExerciseDataForGPT(exercises);
        
        // 4. Utiliser GPT pour trouver les correspondances
        const gptResult = await findMatchingExercisesWithGPT(userMessage, structuredExercises);
        
        // 5. Traiter les résultats
        if (gptResult.aucune_correspondance || !gptResult.correspondances || gptResult.correspondances.length === 0) {
            return {
                success: false,
                response: gptResult.suggestion || "لم أجد أي تمارين تطابق طلبك.",
                responseAr: "لم أجد أي تمارين تطابق طلبك. جرب إعادة صياغة السؤال.",
                responseFr: "Aucun exercice trouvé correspondant à ta demande. Essaie de reformuler.",
                navigation: null
            };
        }
        
        // 6. Si un seul exercice correspond avec un score élevé (>= 0.8), navigation directe
        if (gptResult.correspondances.length === 1 && gptResult.correspondances[0].score_confiance >= 0.8) {
            const matchedExercise = exercises.find(e => e.id === gptResult.correspondances[0].exercice_id);
            if (matchedExercise) {
                const title = matchedExercise.titre || matchedExercise.titleAll || `تمرين ${matchedExercise.numero || ''} صفحة ${matchedExercise.page || ''}`.trim() || 'تمرين بدون عنوان';

                // Préparer les données de l'exercice pour la carte
                const exerciseData = {
                    id: matchedExercise.id,
                    title: title,
                    description: matchedExercise.description || '',
                    page: matchedExercise.page,
                    numero: matchedExercise.numero,
                    thumbnail: matchedExercise.thumbnail,
                    video: matchedExercise.video,
                    manuel_name: matchedExercise.manuel?.name || '',
                    teacher: {
                        id: matchedExercise.teacher?.id,
                        name: matchedExercise.teacher?.full_name,
                        avatar: matchedExercise.teacher?.avatar
                    },
                    score: gptResult.correspondances[0].score_confiance
                };

                return {
                    success: true,
                    response: `ممتاز! سأوجهك إلى التمرين "${title}".`,
                    responseAr: `ممتاز! سأوجهك إلى التمرين "${title}".`,
                    responseFr: `Parfait ! Je t'emmène vers l'exercice "${title}".`,
                    navigation: {
                        screen: 'ExerciseDetailScreen',
                        params: { exerciseId: matchedExercise.id }
                    },
                    exerciseData: exerciseData
                };
            }
        }
        
        // 7. Plusieurs exercices correspondent, proposer une liste
        const matchingExercises = gptResult.correspondances.map(match => {
            const exercise = exercises.find(e => e.id === match.exercice_id);
            if (exercise) {
                const title = exercise.titre || exercise.titleAll || `تمرين ${exercise.numero || ''} صفحة ${exercise.page || ''}`.trim() || 'تمرين بدون عنوان';
                return {
                    id: exercise.id,
                    title: title,
                    page: exercise.page,
                    numero: exercise.numero,
                    videoUrl: exercise.video,
                    manuel: exercise.manuel?.name || 'كتاب غير معروف',
                    teacher: {
                        id: exercise.teacher?.id,
                        full_name: exercise.teacher?.full_name || 'مدرس غير معروف',
                        avatar: exercise.teacher?.avatar,
                        followers_count: exercise.teacher?.followers_count || 0
                    },
                    thumbnail: exercise.thumbnail,
                    score: match.score_confiance,
                    raison: match.raison
                };
            }
            return null;
        }).filter(Boolean);

        return {
            success: true,
            action: 'SHOW_EXERCISES_LIST',
            payload: {
                exercises: matchingExercises
            },
            exerciseCount: matchingExercises.length,
            exercisesList: matchingExercises,
            userMessage: userMessage,
            matiereName: matiereName,
            // Message de base qui sera amélioré par GPT
            message: `وجدت ${matchingExercises.length} تمرين يطابق طلبك. اختر التمرين المطلوب:`,
            messageAr: `وجدت ${matchingExercises.length} تمرين يطابق طلبك. اختر التمرين المطلوب:`,
            messageFr: `J'ai trouvé ${matchingExercises.length} exercice(s) correspondant à ta demande. Choisis l'exercice souhaité :`
        };
        
    } catch (error) {
        console.error('❌ Erreur dans processVoirExercicesIntention:', error);
        return {
            success: false,
            response: "عذراً، حدث خطأ أثناء البحث عن التمارين.",
            responseAr: "عذراً، حدث خطأ أثناء البحث عن التمارين.",
            responseFr: "Désolé, une erreur s'est produite lors de la recherche des exercices.",
            navigation: null
        };
    }
}

module.exports = {
    processVoirExercicesIntention,
    loadCompleteExercisesData,
    structureExerciseDataForGPT,
    findMatchingExercisesWithGPT
};
