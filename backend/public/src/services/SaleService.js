const Sale = require('../models/Sale');

class SaleService {

    // 🔹 Créer une nouvelle vente
    static async createSale(data) {
        try {
            const sale = await Sale.create(data);
            return sale;
        } catch (error) {
            console.error("❌ Erreur lors de la création de la vente : ", error);
            throw error;
        }
    }

    // 🔹 Récupérer une vente par ID
    static async getSaleById(saleId) {
        try {
            const sale = await Sale.findByPk(saleId);
            if (!sale) throw new Error('Vente introuvable');
            return sale;
        } catch (error) {
            console.error("❌ Erreur lors de la récupération de la vente : ", error);
            throw error;
        }
    }

    // 🔹 Récupérer toutes les ventes pour un utilisateur donné (buyer_id)
    static async getUserSales(buyer_id) {
        try {
            const sales = await Sale.findAll({
                where: { buyer_id }
            });
            return sales;
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des ventes de l'utilisateur : ", error);
            throw error;
        }
    }
}

module.exports = SaleService;