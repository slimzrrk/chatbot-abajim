const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class MeetingFile extends Model {}

MeetingFile.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    meeting_id: { type: DataTypes.INTEGER, allowNull: false },
    file_path: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.INTEGER, allowNull: false },
    updated_at: { type: DataTypes.INTEGER, allowNull: false }
}, { 
    sequelize, 
    modelName: 'MeetingFile', 
    tableName: 'meeting_files',
    timestamps: false 
});

module.exports = MeetingFile;
