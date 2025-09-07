const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const Chapter = sequelize.define(
  "Chapter",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    establishedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    openingHour: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    closingHour: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  },
  {
    tableName: "chapters",
    timestamps: true,
  }
);

module.exports = Chapter;
