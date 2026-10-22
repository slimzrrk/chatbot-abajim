const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Sale extends Model {}

Sale.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    seller_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    buyer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    webinar_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    meeting_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    promotion_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    product_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    registration_package_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    tax: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    commission: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    discount: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    total_amount: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    created_at: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    refund_at: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Sale',
    tableName: 'sales',
    timestamps: false
});

module.exports = Sale;
