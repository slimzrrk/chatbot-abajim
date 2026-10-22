const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const SchoolLevel = require("./SchoolLevel");
const User = require("./User");

const Enfant = sequelize.define("enfant", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  Nom: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING(40),
    allowNull: true,
  },
  sexe: {
    type: DataTypes.ENUM("Garçon", "Fille"),
    allowNull: false,
  },
  level_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: SchoolLevel,
      key: "id",
    },
  },
  parent_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: User,
      key: "id",
    },
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,  // Désactive les timestamps automatiques de Sequelize
  freezeTableName: true,  // Empêche Sequelize de mettre le nom de table au pluriel
});

// Définition des relations
Enfant.belongsTo(SchoolLevel, { foreignKey: "level_id", as: "level" });
Enfant.belongsTo(User, { foreignKey: "parent_id", as: "parent" });
Enfant.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = Enfant;
