const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const UsernameChangeLog = sequelize.define(
  "UsernameChangeLog",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "username_change_logs",
    timestamps: true,
    indexes: [{ fields: ["userId", "createdAt"] }],
  }
);

module.exports = UsernameChangeLog;
