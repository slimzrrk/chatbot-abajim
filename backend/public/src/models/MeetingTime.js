const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class MeetingTime extends Model {}

MeetingTime.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    meeting_id: { type: DataTypes.INTEGER, allowNull: false },
    day_label: { type: DataTypes.STRING, allowNull: false },
    level_id: { type: DataTypes.INTEGER, allowNull: false },
    matiere_id: { type: DataTypes.INTEGER, allowNull: false },
    min_students: { type: DataTypes.INTEGER, allowNull: false },
    max_students: { type: DataTypes.INTEGER, allowNull: false },
    meet_date: { type: DataTypes.INTEGER, allowNull: false },
    start_time: { type: DataTypes.INTEGER, allowNull: false },
    end_time: { type: DataTypes.INTEGER, allowNull: false },
    submaterial_id: { type: DataTypes.INTEGER, allowNull: true },
}, { 
    sequelize, 
    modelName: 'MeetingTime', 
    tableName: 'meeting_times',
    timestamps: false 
});

module.exports = MeetingTime;
