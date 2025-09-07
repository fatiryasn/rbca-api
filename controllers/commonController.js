const { Donation } = require("../models");
const {
  updateDonationPaymentStatus,
} = require("../utils/midtransUtils");

exports.midtransNotif = async (req, res) => {
  const data = req.body;

  if (data.order_id.startsWith("donation-")) {
    const donation = await Donation.findOne({
      where: { orderId: data.order_id },
    });

    if (donation) {
      await updateDonationPaymentStatus(data, donation.id);
    }
  }

  return res.status(200).json({
    success: true,
    message: "OK",
  });
};
