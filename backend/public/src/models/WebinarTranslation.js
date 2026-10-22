const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const Webinar = require('./Webinar');

class WebinarTranslation extends Model {}

WebinarTranslation.init({
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    webinar_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: Webinar, key: 'id' }, 
        onDelete: 'CASCADE'
    },
    locale: { type: DataTypes.STRING(255), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    seo_description: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT('long'), allowNull: true }
}, { 
    sequelize, 
    modelName: 'WebinarTranslation',
    tableName: 'webinar_translations',
    timestamps: false
});

// Define relationships
Webinar.hasMany(WebinarTranslation, { foreignKey: 'webinar_id', onDelete: 'CASCADE' });
WebinarTranslation.belongsTo(Webinar, { foreignKey: 'webinar_id' });

module.exports = WebinarTranslation;
