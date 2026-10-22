const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class CardReservation extends Model {}

CardReservation.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    city: {
      type: DataTypes.ENUM(
        "تونس", "أريانة", "بن عروس", "منوبة", "نابل", "زغوان",
        "بنزرت", "باجة", "جندوبة", "الكاف", "سليانة", "القيروان",
        "سوسة", "المنستير", "المهدية", "القصرين", "سيدي بوزيد",
        "قفصة", "توزر", "قبلي", "قابس", "مدنين", "تطاوين", "صفاقس"
      ),
      allowNull: true,
    },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    level_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    phone_number: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM("waiting", "approved", "rejected"),
      defaultValue: "waiting",
      allowNull: false,
    },
    livraison: {
      type: DataTypes.ENUM("Yes", "No"),
      defaultValue: "No",
      allowNull: false,
    },
    enfant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    modelName: "CardReservation",
    tableName: "card_reservations",
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
);

module.exports = CardReservation;
