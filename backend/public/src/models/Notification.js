'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sender: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'system'
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'single'
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    created_at: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    tableName: 'notifications',
    timestamps: false
  });

  Notification.associate = (models) => {
    Notification.hasMany(models.NotificationStatus, {
      foreignKey: 'notification_id',
      as: 'statuses',
      onDelete: 'CASCADE'
    });
  };

  return Notification;
};
