module.exports = (sequelize, DataTypes) => {
    const Wallet = sequelize.define("Wallet", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
    }, {
      tableName: "wallets",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
  
    Wallet.associate = (models) => {
      Wallet.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    };
  
    return Wallet;
  };
  