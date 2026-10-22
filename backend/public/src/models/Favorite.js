module.exports = (sequelize, DataTypes) => {
    const Favorite = sequelize.define("Favorite", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      webinar_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bundle_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: "favorites",
      timestamps: false,        // ✅ car tu n’as pas de updated_at
      underscored: true,        // ✅ pour que Sequelize utilise created_at (et pas createdAt)
    });
  
    return Favorite;
  };
  