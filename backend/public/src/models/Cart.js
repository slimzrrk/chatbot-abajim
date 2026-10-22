module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define("Cart", {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      creator_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      webinar_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      bundle_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      product_order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      reserve_meeting_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      subscribe_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      promotion_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      ticket_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      special_offer_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      product_discount_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      created_at: {
        type: DataTypes.BIGINT,
        allowNull: false
      }
    }, {
      tableName: "cart",
      timestamps: false
    });
  
    Cart.associate = (models) => {
      Cart.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator'
      });
  
      // Relations optionnelles (si tu veux les utiliser)
      Cart.belongsTo(models.Webinar, { foreignKey: 'webinar_id', as: 'webinar' });
      Cart.belongsTo(models.ReserveMeeting, { foreignKey: 'reserve_meeting_id', as: 'reserveMeeting' });
      Cart.belongsTo(models.Sale, { foreignKey: 'subscribe_id', as: 'subscription' });
      // Les autres (ticket, bundle, promo, etc.) à ajouter si tu as leurs modèles
    };
  
    return Cart;
  };
  