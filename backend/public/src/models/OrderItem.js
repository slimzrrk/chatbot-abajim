module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define("OrderItem", {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      model_type: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      model_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      amount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      tax: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      commission: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      discount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      total_amount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      created_at: {
        type: DataTypes.BIGINT,
        allowNull: true
      }
    }, {
      tableName: "order_items",
      timestamps: false
    });
  
    OrderItem.associate = (models) => {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });
    };
  
    return OrderItem;
  };
  