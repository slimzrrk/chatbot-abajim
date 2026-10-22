const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

class Bundle extends Model {}

Bundle.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    creator_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: User, key: 'id' }, 
        onDelete: 'CASCADE' 
    },
    teacher_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: User, key: 'id' }, 
        onDelete: 'CASCADE' 
    },
    category_id: { type: DataTypes.INTEGER, allowNull: true },
    slug: { type: DataTypes.STRING(255), allowNull: false },
    thumbnail: { type: DataTypes.STRING(255), allowNull: true },
    image_cover: { type: DataTypes.STRING(255), allowNull: true },
    video_demo: { type: DataTypes.STRING(255), allowNull: true },
    video_demo_source: { 
        type: DataTypes.ENUM('upload', 'youtube', 'vimeo', 'external_link'), 
        allowNull: true 
    },
    price: { type: DataTypes.INTEGER, allowNull: true },
    points: { type: DataTypes.INTEGER, allowNull: true },
    subscribe: { type: DataTypes.BOOLEAN, defaultValue: false },
    access_days: { type: DataTypes.INTEGER, allowNull: true, comment: 'Number of days to access the bundle' },
    message_for_reviewer: { type: DataTypes.TEXT, allowNull: true },
    status: { 
        type: DataTypes.ENUM('active', 'pending', 'is_draft', 'inactive'), 
        allowNull: false, 
        defaultValue: 'pending' 
    },
    created_at: { type: DataTypes.BIGINT, allowNull: false },
    updated_at: { type: DataTypes.BIGINT, allowNull: false }
}, { 
    sequelize, 
    modelName: 'Bundle',
    tableName: 'bundles',
    timestamps: false
});

// Define relationships
User.hasMany(Bundle, { foreignKey: 'creator_id', onDelete: 'CASCADE' });
Bundle.belongsTo(User, { foreignKey: 'creator_id' });

User.hasMany(Bundle, { foreignKey: 'teacher_id', onDelete: 'CASCADE' });
Bundle.belongsTo(User, { foreignKey: 'teacher_id' });

module.exports = Bundle;
