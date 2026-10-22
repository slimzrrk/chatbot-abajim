const db = require('../models');
const ParentDashboardService = require('../services/ParentDashboardService');

const getDashboardForChild = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!childId || isNaN(childId)) {
      return res.status(400).json({ error: 'Invalid child ID' });
    }

    const dashboardData = await ParentDashboardService.getChildActivitySummary(childId);
    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Erreur dans getDashboardForChild:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};
const logChildActivity = async (req, res) => {
    try {
      const { child_id, action_type, screen_name, reference_id, duration } = req.body;
  
      if (!child_id || !action_type) {
        return res.status(400).json({ error: 'child_id et action_type sont requis' });
      }
  
      await db.ChildActivity.create({
        child_id,
        action_type,
        screen_name,
        reference_id,
        duration,
        created_at: new Date()
      });
  
      return res.status(201).json({ message: 'Activité enregistrée avec succès' });
    } catch (err) {
      console.error('❌ Erreur logChildActivity :', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  };
  
module.exports = {
  getDashboardForChild, logChildActivity
};
