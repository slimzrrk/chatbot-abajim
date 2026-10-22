const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class UserView extends Model {}

UserView.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    video_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'UserView',
    tableName: 'user_views',
    timestamps: false
});

module.exports = UserView;
