const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class PaymentProof extends Model {}

PaymentProof.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    image: { type: DataTypes.STRING, allowNull: false },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
    note: { type: DataTypes.TEXT, allowNull: true },
    approved_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    level_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "PaymentProof",
    tableName: "payment_proofs",
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

module.exports = PaymentProof;
