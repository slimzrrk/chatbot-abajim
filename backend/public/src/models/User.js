const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import the Sequelize instance

const User = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    full_name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    role_name: {
      type: DataTypes.STRING(64),
    },
    role_id: {
      type: DataTypes.INTEGER,
    },
    organ_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // 🔥 A child must always have a parent
    },
    sexe: {
      type: DataTypes.ENUM("Garçon", "Fille"),
      allowNull: true,
    },
    mobile: {
      type: DataTypes.STRING(32),
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    bio: {
      type: DataTypes.TEXT,
    },
    password: {
      type: DataTypes.STRING(255),
    },
    facebook_id: {
      type: DataTypes.STRING(255),
    },
    google_id: {
      type: DataTypes.STRING(255),
    },
    remember_token: {
      type: DataTypes.STRING(255),
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    financial_approval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    avatar: {
      type: DataTypes.STRING(255),
    },
    avatar_settings: {
      type: DataTypes.STRING(255),
    },
    cover_img: {
      type: DataTypes.STRING(255),
    },
    about: {
      type: DataTypes.TEXT,
    },
    address: {
      type: DataTypes.STRING(255),
    },
    country_id: {
      type: DataTypes.INTEGER,
    },
    province_id: {
      type: DataTypes.INTEGER,
    },
    city_id: {
      type: DataTypes.INTEGER,
    },
    district_id: {
      type: DataTypes.INTEGER,
    },
    location: {
      type: DataTypes.STRING(255),
    },
    level_of_training: {
      type: DataTypes.ENUM("1", "2", "3"),
    },
    meeting_type: {
      type: DataTypes.ENUM("all", "in_person", "online"),
    },
    status: {
      type: DataTypes.ENUM("active", "pending", "inactive"),
      defaultValue: "pending",
    },
    access_content: {
      type: DataTypes.STRING(255),
    },
    language: {
      type: DataTypes.STRING(255),
    },
    newsletter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    public_message: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    account_type: {
      type: DataTypes.STRING(128),
    },
    ban: {
      type: DataTypes.STRING(128),
    },
    account_id: {
      type: DataTypes.STRING(128),
    },
    certificate: {
      type: DataTypes.STRING(128),
    },
    commission: {
      type: DataTypes.STRING(128),
    },
    affiliate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    can_create_store: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ban_start_at: {
      type: DataTypes.DATE,
    },
    ban_end_at: {
      type: DataTypes.DATE,
    },
    offline_message: {
      type: DataTypes.TEXT,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
    school_id: {
      type: DataTypes.INTEGER,
    },
    section_id: {
      type: DataTypes.INTEGER,
    },
    level_id: {
      type: DataTypes.INTEGER,
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    otpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: false, // Disable automatic createdAt and updatedAt fields
    freezeTableName: true, // Prevent Sequelize from pluralizing table names
  }
);

module.exports = User;
