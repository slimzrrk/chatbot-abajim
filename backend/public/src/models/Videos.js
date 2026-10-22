const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Video extends Model {}

Video.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    titre: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    video: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    page: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    description: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    numero: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    manuel_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'manuels',
            key: 'id'
        }
    },
    thumbnail: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    vues: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    titleAll: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING'
    },
    total_minutes_watched: {
        type: DataTypes.DOUBLE(8,2),
        defaultValue: 0.00
    }
}, {
    sequelize,
    modelName: 'Video',
    tableName: 'videos',
    timestamps: false
});

module.exports = Video;
