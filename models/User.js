const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("Admin", "Supervisor", "Common"),
      allowNull: false,
      defaultValue: "Common",
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "chapters",
        key: "id",
      },
    },
    authProvider: {
      type: DataTypes.ENUM("Local", "Google"),
      allowNull: false,
      defaultValue: "Local",
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profilePicturePublicId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["email"] },
      { unique: true, fields: ["username"] },
      { fields: ["role"] },
      { fields: ["isActive"] },
    ],
  }
);

module.exports = User;
