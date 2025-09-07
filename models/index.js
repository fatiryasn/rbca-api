const sequelize = require("../configs/database");

const Donation = require("./Donation");
const PaymentLog = require("./PaymentLog");
const Chapter = require("./Chapter");
const User = require("./User");

//donation to payment log CASCADE
Donation.hasMany(PaymentLog, { foreignKey: "donationId", onDelete: "CASCADE" });
PaymentLog.belongsTo(Donation, {
  foreignKey: "donationId",
  onDelete: "CASCADE",
});

//user to donation SET NULL
User.hasMany(Donation, { foreignKey: "userId", onDelete: "CASCADE" });
Donation.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

//chapter to user SET NULL
Chapter.hasMany(User, { foreignKey: "chapterId", onDelete: "SET NULL" });
User.belongsTo(Chapter, { foreignKey: "chapterId", onDelete: "SET NULL" });

module.exports = {
  sequelize,
  Donation,
  User,
  PaymentLog,
  Chapter,
};
