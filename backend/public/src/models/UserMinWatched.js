const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class UserMinWatched extends Model {}

UserMinWatched.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    minutes_watched: {
        type: DataTypes.DOUBLE(8, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    latest_watched_day: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
    },
    created_at: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    updated_at: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    minutes_watched_day: {
        type: DataTypes.DOUBLE(8, 2),
        allowNull: false,
        defaultValue: 0.00
    }
}, {
    sequelize,
    modelName: 'UserMinWatched',
    tableName: 'user_min_watched',
    timestamps: false
});

module.exports = UserMinWatched;
