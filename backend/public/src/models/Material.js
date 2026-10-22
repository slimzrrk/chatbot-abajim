const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    return sequelize.define("materials", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        section_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        timestamps: false,
        freezeTableName: true,
    });
};
