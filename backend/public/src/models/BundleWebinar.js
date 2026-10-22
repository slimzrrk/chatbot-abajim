const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const Webinar = require('./Webinar');
const Bundle = require('./Bundle');
const User = require('./User');

class BundleWebinar extends Model {}

BundleWebinar.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    creator_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: User, key: 'id' }, 
        onDelete: 'CASCADE' 
    },
    bundle_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: Bundle, key: 'id' }, 
        onDelete: 'CASCADE' 
    },
    webinar_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: Webinar, key: 'id' }, 
        onDelete: 'CASCADE' 
    },
    order: { type: DataTypes.INTEGER, allowNull: true }
}, { 
    sequelize, 
    modelName: 'BundleWebinar',
    tableName: 'bundle_webinars',
    timestamps: false
});

// Define relationships
Bundle.hasMany(BundleWebinar, { foreignKey: 'bundle_id', onDelete: 'CASCADE' });
BundleWebinar.belongsTo(Bundle, { foreignKey: 'bundle_id' });

Webinar.hasMany(BundleWebinar, { foreignKey: 'webinar_id', onDelete: 'CASCADE' });
BundleWebinar.belongsTo(Webinar, { foreignKey: 'webinar_id' });

User.hasMany(BundleWebinar, { foreignKey: 'creator_id', onDelete: 'CASCADE' });
BundleWebinar.belongsTo(User, { foreignKey: 'creator_id' });

module.exports = BundleWebinar;
