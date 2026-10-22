const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const db = require('../models');

// ✅ Récupère dynamiquement les manuels et matières
const getManuelsEtMatieres = async () => {
  const manuels = await db.Manuel.findAll({ attributes: ['name'] });
  const matieres = await db.Material.findAll({ attributes: ['name'] });

  return {
    manuels: manuels.map(m => m.name),
    matieres: matieres.map(m => m.name)
  };
};

const extractEntities = async (message, history, manuels, matieres) => {
  if (!Array.isArray(history)) history = [];

  const lastMessages = history
    .slice(-5)
    .map(h => `${h.role === 'user' ? 'الطفل' : 'المساعد'}: ${h.content}`)
    .join('\n');

  const fullPrompt = `أنت مساعد ذكي متخصص في استخراج المعلومات الأساسية من محادثة طفل على تطبيق تعليمي، مع التركيز على الكيانات المتعلقة بالدراسة.

# التعليمات

- هدفك هو استخراج الكيانات التالية إذا تم ذكرها:
  - المادة (matiere)
  - المستوى (niveau)
  - اسم الكتاب (manuelName)
  - رقم الصفحة (page)
  - رقم التمرين (numero_exercice) - مثل: "التمرين 3" أو "تمرين 1"
  - اسم التمرين (nom_exercice) - مثل: "أتصرف" أو "أعمق فهمي" أو "أطبق"
  - اسم ولقب المعلم (teacherFirstName, teacherLastName)

- لا تستخرج أو تفترض أي معلومات غير مذكورة بشكل واضح في المحادثة.
- استكمل الكيانات الناقصة باستخدام الرسائل السابقة فقط إذا كان هناك سياق ارتباط واضح ومباشر.
- إذا لم تذكر الكيانات بوضوح في المحادثة أو الرسائل السابقة، قم بتعيينها كـ null.
- تأكد من أن رقم الصفحة هو عدد صحيح.
- لا تذكر مادة أو كتاب غير موجود في المحادثة أو في قائمة المواد أو الكتب المتاحة.

# ملاحظة مهمة

- إذا تم ذكر كلمات مثل "العربية"، "الفرنسية"، "رياضيات"، "إيقاظ"، "إنجليزية"، فافترض أنها تشير إلى مادة من المواد المتوفرة.
- لا تترك الكيان المادة كـ null إذا كان من الواضح أنه مذكور في صيغة غير رسمية.

# المصادر

- **المواد المتاحة:** ${matieres.join(', ')}
- **الكتب المتاحة:** ${manuels.join(', ')}

# البيانات

- **الحوار السابق:** يتم احتساب فقط الرسائل التي قد توفر سياقًا مباشرًا ومرتبطًا.
${lastMessages}

- **الرسالة الجديدة:**
الطفل: ${message}

# Output Format

📦 أرجع فقط JSON بهذا الشكل بدون شرح أو تنسيقات Markdown:

{
  "matiere": "...",
  "niveau": "...",
  "manuelName": "...",
  "page": "...",
  "numero_exercice": "...",
  "nom_exercice": "...",
  "teacherFirstName": "...",
  "teacherLastName": "...",
  "extractedDirectly": {
    "matiere": "...",
    "manuelName": "...",
    "niveau": "...",
    "page": "...",
    "numero_exercice": "...",
    "nom_exercice": "..."
  }
}
`;

  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "أنت مصنف كيانات ذكي. استخرج فقط المعلومات المطلوبة وأرجعها ككائن JSON." },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const raw = result.choices[0].message.content.trim();

    // ✅ Nettoyer les balises Markdown
    const cleanedResponse = raw.replace(/```json|```/g, '').trim();

    let entities = {
      matiere: null,
      niveau: null,
      manuelName: null,
      page: null,
      numero_exercice: null,
      nom_exercice: null,
      teacherFirstName: null,
      teacherLastName: null,
      extractedDirectly: {
        matiere: null,
        manuelName: null,
        niveau: null,
        page: null,
        numero_exercice: null,
        nom_exercice: null
      }
    };

    try {
      entities = JSON.parse(cleanedResponse);
      console.log("📌 Entités détectées avec succès :", entities);
    } catch (parseError) {
      console.error('❌ Erreur de conversion en JSON:', parseError.message);
      console.log("📌 Réponse brute d\'OpenAI :", raw);
    }

    return entities;
  } catch (error) {
    console.error('❌ Erreur OpenAI:', error.message);
    return {
      matiere: null,
      niveau: null,
      manuelName: null,
      page: null,
      numero_exercice: null,
      nom_exercice: null,
      teacherFirstName: null,
      teacherLastName: null,
      extractedDirectly: {
        matiere: null,
        manuelName: null,
        niveau: null,
        page: null,
        numero_exercice: null,
        nom_exercice: null
      }
    };
  }
};

module.exports = { extractEntities, getManuelsEtMatieres };
