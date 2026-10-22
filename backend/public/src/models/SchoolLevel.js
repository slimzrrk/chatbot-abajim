const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SchoolLevel = sequelize.define(
  "SchoolLevel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "school_levels", // ✅ Correspond exactement au nom de la table dans la BD
    timestamps: false, // ✅ Désactive created_at et updated_at puisqu'ils sont NULL
    freezeTableName: true, // ✅ Évite la modification automatique du nom de la table
  }
);

module.exports = SchoolLevel;
