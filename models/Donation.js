const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const Donation = sequelize.define(
  "Donation",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("Pending", "Success", "Cancelled", "Refund"),
      allowNull: false,
      defaultValue: "Pending",
    },
  },
  {
    tableName: "donations",
    timestamps: true,
  }
);

module.exports = Donation;
