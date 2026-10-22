const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Submaterial extends Model {}

Submaterial.init({
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    material_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    name: { 
        type: DataTypes.STRING, 
        allowNull: false 
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
    modelName: 'Submaterial', 
    tableName: 'submaterials',
    timestamps: false 
});

module.exports = Submaterial;
