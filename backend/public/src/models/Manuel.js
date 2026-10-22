const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    return sequelize.define("manuels", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        material_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        logo: {
            type: DataTypes.STRING(64),
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
