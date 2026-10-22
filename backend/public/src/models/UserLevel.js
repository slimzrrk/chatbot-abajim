const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class UserLevel extends Model {}

UserLevel.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    level_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    teacher_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    sequelize,
    modelName: 'UserLevel',
    tableName: 'user_level',
    timestamps: false
});

module.exports = UserLevel;
