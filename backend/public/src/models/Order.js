module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define("Order", {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'paying', 'paid', 'fail'),
        allowNull: false
      },
      payment_method: {
        type: DataTypes.ENUM('card', 'online', 'balance'),
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
      total_discount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      total_amount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      reference_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      created_at: {
        type: DataTypes.BIGINT,
        allowNull: false
      }
    }, {
      tableName: "orders",
      timestamps: false
    });
  
    Order.associate = (models) => {
      Order.hasMany(models.OrderItem, {
        foreignKey: 'order_id',
        as: 'items'
      });
    };
  
    return Order;
  };
  