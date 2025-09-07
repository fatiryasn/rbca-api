const crypto = require("crypto");
const { Donation, PaymentLog } = require("../models");

exports.updateDonationPaymentStatus = async (data, donationId) => {
  //verify sig key
  const hash = crypto
    .createHash("sha512")
    .update(
      `${data.order_id}${data.status_code}${data.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`
    )
    .digest("hex");

  if (data.signature_key !== hash) {
    return {
      success: false,
      message: "Invalid signature key",
    };
  }

  let responseData = null;
  let transactionStatus = data.transaction_status;
  let fraudStatus = data.fraud_status;

  //create new payment log
  await PaymentLog.create({
    donationId,
    transactionId: data.transaction_id,
    rawResponse: data,
  });

  //success
  if (transactionStatus === "capture") {
    if (fraudStatus === "accept") {
      [_, responseData] = await Donation.update(
        {
          status: "Success",
          paymentMethod: data.payment_type,
        },
        { where: { orderId: data.order_id }, returning: true }
      );
    }
    //success
  } else if (transactionStatus === "settlement") {
    [_, responseData] = await Donation.update(
      {
        status: "Success",
        paymentMethod: data.payment_type,
      },
      { where: { orderId: data.order_id }, returning: true }
    );
    //cancel
  } else if (
    transactionStatus === "cancel" ||
    transactionStatus === "deny" ||
    transactionStatus === "expire"
  ) {
    [_, responseData] = await Donation.update(
      {
        status: "Cancelled",
      },
      { where: { orderId: data.order_id }, returning: true }
    );
    //pending
  } else if (transactionStatus === "pending") {
    [_, responseData] = await Donation.update(
      {
        status: "Pending",
      },
      { where: { orderId: data.order_id }, returning: true }
    );
    //refund
  } else if (transactionStatus === "refunded") {
    [_, responseData] = await Donation.update(
      {
        status: "Refund",
      },
      { where: { orderId: data.order_id }, returning: true }
    );
  }

  return {
    success: true,
    data: responseData,
  };
};
