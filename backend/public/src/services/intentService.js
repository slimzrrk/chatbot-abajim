const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Détecte l'intention de l'utilisateur en fonction du message fourni
 * @param {string} message - Message de l'utilisateur
 * @returns {Promise<string>} - Intention détectée
 */
const detectIntent = async (message, history = []) => {
  // Vérifier si c'est une demande de recommandation suivante
  const isNextRequest = /suivant|autre|التالي|آخر|أخرى|غيره|غيرها/i.test(message);

  // Rechercher la dernière intention dans l'historique
  let lastIntent = null;
  if (isNextRequest && Array.isArray(history)) {
    // Parcourir l'historique à l'envers pour trouver la dernière intention
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      if (entry.role === 'assistant' && entry.content) {
        // Si la dernière réponse contient une recommandation d'exercice
        if (entry.content.includes('تمرين') &&
            (entry.content.includes('أريد تمرينًا آخر') ||
             entry.content.includes('التالي'))) {
          console.log("🔄 Détection d'une demande de recommandation suivante d'exercice");
          return 'نية: "recommander_exercice"';
        }
        // Si la dernière réponse contient une recommandation de professeur
        else if (entry.content.includes('أستاذ') &&
                (entry.content.includes('أريد أستاذًا آخر') ||
                 entry.content.includes('التالي'))) {
          console.log("🔄 Détection d'une demande de recommandation suivante de professeur");
          return 'نية: "recommander_professeur"';
        }
        // Si la dernière réponse contient une recommandation de cours
        else if ((entry.content.includes('درس') || entry.content.includes('دورة') || entry.content.includes('دروس')) &&
                (entry.content.includes('أريد درسًا آخر') ||
                 entry.content.includes('التالي'))) {
          console.log("🔄 Détection d'une demande de recommandation suivante de cours");
          return 'نية: "recommander_cours"';
        }
        break;
      }
    }

    // Si nous n'avons pas pu déterminer l'intention à partir de l'historique,
    // mais que c'est une demande de "suivant" ou "autre", vérifier s'il existe une session active
    const db = require('../models');
    try {
      const activeSession = await db.ChatbotRecommendation.findOne({
        where: { user_id: history[0]?.user_id },
        order: [['created_at', 'DESC']]
      });

      if (activeSession) {
        // Vérifier le type de recommandation
        if (activeSession.recommendation_type === 'exercise') {
          console.log("🔄 Session active de recommandation d'exercices détectée");
          return 'نية: "recommander_exercice"';
        } else if (activeSession.recommendation_type === 'teacher') {
          console.log("🔄 Session active de recommandation de professeurs détectée");
          return 'نية: "recommander_professeur"';
        } else if (activeSession.recommendation_type === 'course') {
          console.log("🔄 Session active de recommandation de cours détectée");
          return 'نية: "recommander_cours"';
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la vérification de la session active:", error.message);
    }
  }

  const historiqueTextuel = history
    .map(entry => `${entry.role === 'user' ? '👦 المستخدم' : '🤖 المساعد'}: ${entry.content}`)
    .join('\n');

  const prompt = `
أنت مساعد ذكي في تصنيف نية الطفل داخل تطبيق تعليمي. يجب أن تعتمد على الجملة الأخيرة **مع الأخذ بعين الاعتبار المحادثة السابقة** لفهم السياق الكامل.

# قائمة النوايا الممكنة:
- "voir_cours": المستخدم يريد البحث عن درس محدد بالاسم أو مشاهدة دروس محددة. هذا يشمل أي طلب للبحث عن درس معين (مثل: "نحب نشوف cours sur les fractions" أو "أريد أن أرى درس الضرب" أو "هل يوجد درس اسمه..." أو "أبحث عن درس..." أو "أريد درس الهندسة").
- "voir_exercice": المستخدم يريد الانتقال إلى تمرين محدد بالرقم والصفحة (مثل: "أريد التمرين رقم 3 من الصفحة 50" أو "اعرض التمرين الأول في الصفحة 25" أو "أريد حل التمرين 5 صفحة 10").
- "voir_exercices": المستخدم يريد رؤية قائمة التمارين المتاحة في كتاب أو صفحة معينة (مثل: "أرني التمارين في الصفحة 5" أو "ما هي التمارين المتاحة في كتاب الرياضيات" أو "أريد التمارين من الصفحة 10").
- "voir_meets": المستخدم يريد لقاء مباشر مع معلم.
- "abonnement_prof": المستخدم يريد الاشتراك في أستاذ معين.
- "abonnement_platforme": المستخدم يريد الاشتراك في المنصة بشكل عام.
- "voir_manuels": المستخدم يريد فتح أو تصفح كتاب مدرسي أو صفحة معينة من كتاب (مثل: "أريد أن أرى كتاب الرياضيات" أو "أريد أن أرى الصفحة 15 من كتاب الرياضيات" أو "أريد أن أرى الصفحة 10 من مادة الرياضيات" أو "افتح لي الصفحة 20 من كتاب العربية"). **مهم**: إذا ذُكرت كلمة "صفحة" مع "كتاب" أو "مادة" بدون ذكر كلمة "تمارين" أو "تمرين"، فهذه نية voir_manuels وليس voir_exercices.
- "voir_profil_prof": المستخدم يسأل عن معلم محدد بالاسم - سواء كان يريد معرفة إذا كان موجود في المنصة أو يدرس فيها أو معلومات عنه (مثل: "هل المعلم أحمد موجود؟" أو "المعلمة فاطمة تقري لنا؟" أو "ياخي المعلمة نسرين تدرس هنا؟" أو "هل الأستاذة سارة تعلم في أبجيم؟" أو "المعلم طارق يعلم في المنصة؟" أو "أريد معرفة ملف الأستاذ محمد"). **مهم جداً**: أي سؤال يحتوي على اسم معلم محدد يجب تصنيفه كـ voir_profil_prof وليس question_generale.
- "storytime": المستخدم يطلب قصة ترفيهية.
- "recommander_professeur": المستخدم يطلب اقتراح معلم.
- "recommander_exercice": المستخدم يطلب اقتراح تمرين مناسب له أو توصية شخصية (مثل: "أريد تمرينًا في الرياضيات" أو "اقترح لي تمرينًا" أو "أوصني بتمرين").
- "recommander_cours": المستخدم يطلب اقتراح دروس عامة أو مواد تعليمية بدون تحديد اسم معين (مثل: "اقترح لي دروسًا" أو "أريد دروسًا في الرياضيات" أو "ما هي الدروس المتاحة").
- "question_generale": سؤال عام في التعليم **بدون ذكر اسم معلم محدد**. إذا ذُكر اسم معلم محدد، فهو voir_profil_prof وليس question_generale.
- "accueil": تحية أو بدء المحادثة.
- "aide": طلب توجيه عام حول استخدام التطبيق.
- "ignorer_contenu": غير مفهوم.
- "autre": لا ينتمي لأي مما سبق.

# ملاحظات مهمة:
إذا كان المستخدم يطلب "تمرين آخر" أو "التالي" بعد أن تم اقتراح تمرين له، فهذه نية "recommander_exercice" وليست "voir_exercices".
إذا كان المستخدم يطلب "أستاذ آخر" أو "التالي" بعد أن تم اقتراح أستاذ له، فهذه نية "recommander_professeur".
إذا كان المستخدم يطلب "درس آخر" أو "التالي" بعد أن تم اقتراح درس له، فهذه نية "recommander_cours".

**قاعدة ذهبية للمعلمين**: إذا ذُكر اسم معلم محدد في الرسالة (مثل: نسرين، طارق، فاطمة، أحمد، إلخ)، فالنية هي "voir_profil_prof" حتى لو كان السؤال عاماً. لا تصنف أي سؤال يحتوي على اسم معلم كـ "question_generale".

# الفرق بين voir_exercice و voir_exercices و recommander_exercice:
- "voir_exercice": عندما يريد المستخدم الانتقال إلى تمرين محدد بالرقم والصفحة (مثل: "التمرين 3 صفحة 50")
- "voir_exercices": عندما يريد المستخدم رؤية قائمة التمارين المتاحة في كتاب أو صفحة محددة
- "recommander_exercice": عندما يريد المستخدم توصية شخصية لتمرين مناسب له (مثل: "أريد تمرينًا" أو "اقترح لي تمرينًا")

# الفرق المهم بين voir_manuels و voir_exercices:
- "voir_manuels": عندما يريد المستخدم فتح صفحة من كتاب للقراءة أو التصفح (مثل: "أريد أن أرى الصفحة 10 من مادة الرياضيات" أو "أريد أن أرى الصفحة 15 من كتاب الرياضيات")
- "voir_exercices": عندما يريد المستخدم رؤية التمارين الموجودة في صفحة معينة (مثل: "أريد التمارين من الصفحة 10" أو "أرني تمارين الصفحة 15")

**قاعدة مهمة**: إذا ذُكرت "الصفحة X من كتاب/مادة Y" بدون ذكر كلمة "تمارين" أو "تمرين"، فهذه نية "voir_manuels" وليس "voir_exercices".

# سياق المحادثة:
${historiqueTextuel}

# الجملة الأخيرة التي أرسلها الطفل:
"${message}"

✅ استخرج فقط النية **المرتبطة بالجملة الأخيرة** مع أخذ ما قبلها بعين الاعتبار. لا تشرح، فقط أجب بهذا الشكل:
نية: "اسم_النية"
  `;

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'أنت مصنف نيات ذكي للأطفال. استخدم المحادثة بالكامل لتحديد نيتهم الأخيرة.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 100,
    });

    const reply = result.choices[0].message.content.trim();
    console.log("🎯 Intention détectée :", reply);
    return reply;
  } catch (error) {
    console.error('❌ Erreur dans detectIntent:', error.message);
    return 'نية: "ignorer_contenu"';
  }
};


module.exports = { detectIntent };
