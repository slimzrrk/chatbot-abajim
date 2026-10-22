const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '../services/faqScript.json');
let scriptData = [];

try {
  scriptData = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
} catch (err) {
  console.error('❌ Erreur de lecture du fichier faqScript.json', err.message);
}

const getStructureExample = (intent, matiere, niveau) => {
  return scriptData.find(
    entry =>
      entry.intent === intent &&
      (entry.matiere === matiere || entry.matiere === null) &&
      (entry.niveau === niveau || entry.niveau === null)
  );
};

module.exports = { getStructureExample };
