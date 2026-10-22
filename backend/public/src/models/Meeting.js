const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Meeting extends Model {}

Meeting.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teacher_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    discount: { type: DataTypes.INTEGER, allowNull: true },
    group_meeting: { type: DataTypes.BOOLEAN, defaultValue: false },
    online_group_min_student: { type: DataTypes.INTEGER, allowNull: true },
    online_group_max_student: { type: DataTypes.INTEGER, allowNull: true },
    online_group_amount: { type: DataTypes.INTEGER, allowNull: true },
    disabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.INTEGER, allowNull: false },
    discount_start_date: { type: DataTypes.INTEGER, allowNull: true },  // ✅ Ajouté
    discount_end_date: { type: DataTypes.INTEGER, allowNull: true }     // ✅ Ajouté
}, { 
    sequelize, 
    modelName: 'Meeting', 
    tableName: 'meetings',
    timestamps: false 
});

module.exports = Meeting;
