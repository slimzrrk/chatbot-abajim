const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const findBestTeacherName = async (userTeacherFirstName, userTeacherLastName, teachersList) => {
  const fullPrompt = `
مهمتك هي اختيار أفضل مطابقة بين المعلمين بناءً على الاسم الذي يقدمه الطفل.

# الاسم الذي يرسله الطفل:
"${userTeacherFirstName} ${userTeacherLastName}"

# قائمة المعلمين:
${teachersList.map((t, idx) => `${idx + 1}. ${t.full_name}`).join('\n')}

# صيغة الإجابة المطلوبة (دون شرح إضافي):
{
  "chosenTeacherFullName": "اسم المعلم المطابق بالضبط كما هو موجود في القائمة"
}
`;

  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "أنت مساعد ذكي، اختر فقط أفضل معلم بناءً على تطابق الاسم، لا تقدم أي شرح إضافي." },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0,
      max_tokens: 200,
    });

    const response = result.choices[0].message.content.trim();
    let extracted = { chosenTeacherFullName: null };

    try {
      extracted = JSON.parse(response);
      console.log("🎯 Professeur choisi par GPT :", extracted);
    } catch (parseError) {
      console.error('❌ Erreur JSON:', parseError.message);
      console.log("📌 Réponse brute d'OpenAI :", response);
    }

    return extracted.chosenTeacherFullName;
  } catch (error) {
    console.error('❌ Erreur GPT (findBestTeacherName):', error.message);
    return null;
  }
};

module.exports = { findBestTeacherName };
