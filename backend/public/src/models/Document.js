const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");  // Import de l'instance Sequelize

const Document = sequelize.define("documents", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  nombre_page: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  pdf: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  manuel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  "3d_path_teacher": {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  "pathenfant": {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  timestamps: false,
  freezeTableName: true, // Pour empêcher Sequelize de changer le nom de la table
});

module.exports = Document;
