const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Subscribe extends Model {}

Subscribe.init({
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    days: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        comment: 'Number of days for the subscription'
    },
    price: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false,
        comment: 'Price in Tunisian Dinars'
    },
    usable_count: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        comment: 'Number of times the subscription can be used'
    },
    level_id: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        comment: 'School level ID if subscription is level-specific'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Subscription plan name'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Subscription plan description'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: 'Subscription plan status'
    },
    created_at: { 
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: DataTypes.NOW 
    },
    updated_at: { 
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: DataTypes.NOW 
    }
}, { 
    sequelize, 
    modelName: 'Subscribe', 
    tableName: 'subscribes',
    timestamps: false 
});

module.exports = Subscribe;
