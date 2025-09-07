const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const PaymentLog = sequelize.define(
  "PaymentLog",
  {
    donationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "donations",
        key: "id",
      },
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rawResponse: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "payment_logs",
    timestamps: true,
    indexes: [{ fields: ["transactionId"] }],
  }
);

module.exports = PaymentLog;
