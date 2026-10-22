const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class ReserveMeeting extends Model {}

ReserveMeeting.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    meeting_id: { type: DataTypes.INTEGER, allowNull: false },
    sale_id: { type: DataTypes.INTEGER, allowNull: true },
    meeting_time_id: { type: DataTypes.INTEGER, allowNull: false },
    day: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.INTEGER, allowNull: false },
    start_at: { type: DataTypes.INTEGER, allowNull: false },
    end_at: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    paid_amount: { type: DataTypes.INTEGER, allowNull: false },
    meeting_type: { type: DataTypes.STRING, allowNull: true },
    student_count: { type: DataTypes.INTEGER, allowNull: false },
    discount: { type: DataTypes.INTEGER, allowNull: true },
    link: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.INTEGER, allowNull: false },
    locked_at: { type: DataTypes.INTEGER, allowNull: true },
    reserved_at: { type: DataTypes.INTEGER, allowNull: true },
}, { 
    sequelize, 
    modelName: 'ReserveMeeting', 
    tableName: 'reserve_meetings',
    timestamps: false 
});

module.exports = ReserveMeeting;
