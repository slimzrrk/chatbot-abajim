const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

class WebinarChapter extends Model {}

WebinarChapter.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' },
        onDelete: 'CASCADE'
    },
    webinar_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    order: { type: DataTypes.INTEGER, allowNull: true },
    check_all_contents_pass: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    },
    created_at: { type: DataTypes.INTEGER, allowNull: false }
}, {
    sequelize,
    modelName: 'WebinarChapter',
    tableName: 'webinar_chapters',
    timestamps: false
});

// ✅ Relations définies uniquement dans index.js
User.hasMany(WebinarChapter, { foreignKey: 'user_id', onDelete: 'CASCADE' });
WebinarChapter.belongsTo(User, { foreignKey: 'user_id' });

module.exports = WebinarChapter;
