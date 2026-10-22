const SaleService = require('../services/SaleService');

class SaleController {

    // 🔹 Créer une nouvelle vente
    static async createSale(req, res) {
        try {
            const sale = await SaleService.createSale(req.body);
            res.status(201).json(sale);
        } catch (error) {
            console.error("❌ Erreur lors de la création de la vente : ", error);
            res.status(500).json({ message: 'Erreur lors de la création de la vente', error: error.message });
        }
    }

    // 🔹 Récupérer une vente par ID
    static async getSaleById(req, res) {
        try {
            const sale = await SaleService.getSaleById(req.params.id);
            res.status(200).json(sale);
        } catch (error) {
            console.error("❌ Erreur lors de la récupération de la vente : ", error);
            res.status(500).json({ message: 'Erreur lors de la récupération de la vente', error: error.message });
        }
    }

    // 🔹 Récupérer toutes les ventes pour un utilisateur donné
    static async getUserSales(req, res) {
        try {
            const sales = await SaleService.getUserSales(req.params.buyer_id);
            res.status(200).json(sales);
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des ventes de l'utilisateur : ", error);
            res.status(500).json({ message: 'Erreur lors de la récupération des ventes', error: error.message });
        }
    }
}

module.exports = SaleController;