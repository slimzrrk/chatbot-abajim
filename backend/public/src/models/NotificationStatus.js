'use strict';

module.exports = (sequelize, DataTypes) => {
  const NotificationStatus = sequelize.define('NotificationStatus', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    notification_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    seen_at: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    tableName: 'notifications_status',
    timestamps: false
  });

  NotificationStatus.associate = (models) => {
    NotificationStatus.belongsTo(models.Notification, {
      foreignKey: 'notification_id',
      as: 'notification',
      onDelete: 'CASCADE'
    });
  };

  return NotificationStatus;
};
