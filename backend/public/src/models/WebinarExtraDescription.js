const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const Webinar = require('./Webinar');
const User = require('./User');

class WebinarExtraDescription extends Model {}

WebinarExtraDescription.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    creator_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: User, key: 'id' }, 
        onDelete: 'CASCADE' 
    },
    webinar_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: Webinar, key: 'id' }, 
        onDelete: 'CASCADE' 
    },
    type: { 
        type: DataTypes.ENUM('learning_materials', 'company_logos', 'requirements'), 
        allowNull: false 
    },
    order: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.BIGINT, allowNull: false }
}, { 
    sequelize, 
    modelName: 'WebinarExtraDescription',
    tableName: 'webinar_extra_descriptions',
    timestamps: false
});

// Define relationships
Webinar.hasMany(WebinarExtraDescription, { foreignKey: 'webinar_id', onDelete: 'CASCADE' });
WebinarExtraDescription.belongsTo(Webinar, { foreignKey: 'webinar_id' });

User.hasMany(WebinarExtraDescription, { foreignKey: 'creator_id', onDelete: 'CASCADE' });
WebinarExtraDescription.belongsTo(User, { foreignKey: 'creator_id' });

module.exports = WebinarExtraDescription;
