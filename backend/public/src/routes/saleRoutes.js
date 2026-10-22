const express = require('express');
const router = express.Router();
const SaleController = require('../controllers/SaleController');

// 🔹 Créer une vente
router.post('/', SaleController.createSale);

// 🔹 Récupérer une vente par ID
router.get('/:id', SaleController.getSaleById);

// 🔹 Récupérer toutes les ventes pour un utilisateur
router.get('/user/:buyer_id', SaleController.getUserSales);

module.exports = router;