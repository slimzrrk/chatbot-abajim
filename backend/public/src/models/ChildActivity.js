module.exports = (sequelize, DataTypes) => {
    const ChildActivity = sequelize.define('ChildActivity', {
      child_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      action_type: {
        type: DataTypes.ENUM('navigation', 'book', 'webinar', 'meeting', 'video'),
        allowNull: false
      },
      screen_name: {
        type: DataTypes.STRING, // utilisé seulement pour navigation
        allowNull: true
      },
      reference_id: {
        type: DataTypes.INTEGER, // ID du livre/webinar/réunion/vidéo
        allowNull: true
      },
      duration: {
        type: DataTypes.INTEGER, // en secondes
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'child_activities',
      timestamps: false
    });
  
    return ChildActivity;
  };
  