const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.getBestManuelName = async (userMessage, manuels) => {
  const names = manuels.map(m => m.name);

  const prompt = `
لدي قائمة من الكتب المدرسية، والطفل قال: "${userMessage}"

اختر من بين هذه القائمة الكتاب الذي يقصده الطفل (إذا وُجد). أرجع فقط الاسم المطابق تمامًا كما هو في القائمة دون شرح.

القائمة:
${names.map((n, i) => `${i + 1}. ${n}`).join('\n')}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "أنت مساعد ذكي تختار اسم الكتاب المناسب من القائمة فقط." },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      max_tokens: 50
    });

    const content = response.choices[0].message.content.trim();
    const match = names.find(name => content.includes(name));

    return match || null;

  } catch (err) {
    console.error("❌ Erreur OpenAI manuelFinder:", err.message);
    return null;
  }
};
