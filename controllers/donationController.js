const { Donation, User, PaymentLog } = require("../models");
const { snap } = require("../configs/midtrans");
const moment = require("moment");
const { Op } = require("sequelize");

//get all donations
exports.getAllDonations = async (req, res) => {
  try {
    let { page, limit, status, sort, search } = req.query;

    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 30;

    if (![30, 50, 80].includes(limit)) {
      limit = 30;
    }

    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

     let order = [["createdAt", "DESC"]];
     if (sort === "oldest") {
       order = [["createdAt", "ASC"]];
     } else if (sort === "az") {
       order = [["name", "ASC"]];
     } else if (sort === "za") {
       order = [["name", "DESC"]];
     }

    // query data
    const { rows: donations, count: totalItems } =
      await Donation.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order,
        attributes: [
          "id",
          "orderId",
          "name",
          "email",
          "amount",
          "paymentMethod",
          "status",
          "createdAt",
          "updatedAt",
        ],
        include: [
          {
            model: User,
            attributes: ["id", "name", "email"],
          },
        ],
      });

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get user donations
exports.getAllUserDonations = async (req, res) => {
  try {
    let { page, limit, status, sort, search } = req.query;

    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 30;

    if (![30, 50, 80].includes(limit)) {
      limit = 30;
    }

    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };

    if (status) {
      whereClause.status = status;
    }
      if (search) {
        whereClause[Op.and] = [
          { userId: req.user.id },
          {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
            ],
          },
        ];
        delete whereClause.userId;
      }

     let order = [["createdAt", "DESC"]];
     if (sort === "oldest") {
       order = [["createdAt", "ASC"]];
     } else if (sort === "az") {
       order = [["name", "ASC"]];
     } else if (sort === "za") {
       order = [["name", "DESC"]];
     }

    // query data
    const { rows: donations, count: totalItems } =
      await Donation.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order,
        attributes: [
          "id",
          "orderId",
          "name",
          "email",
          "amount",
          "paymentMethod",
          "status",
          "createdAt",
          "updatedAt"
        ],
        include: [
          {
            model: User,
            attributes: ["id", "name", "email"],
          },
        ],
      });

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get donation by id
exports.getDonationById = async (req, res) => {
  try {
    const donationId = req.params.id;

    const donation = await Donation.findByPk(donationId, {
      include: [
        {
          model: User,
          attributes: ["id", "username", "name", "email"],
        },
        {
          model: PaymentLog,
          attributes: ["transactionId", "rawResponse"],
        },
      ],
    });

    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donasi tidak ditemukan" });
    }

    res.status(200).json({
      success: true,
      message: "Donasi ditemukan",
      data: donation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//create new donation
exports.createDonation = async (req, res) => {
  try {
    const { userId, name, email, amount, message, isAnonymous } = req.body;

    let user;
    if (userId) {
      user = await User.findByPk(userId);
    }

    const newDonation = await Donation.create({
      userId: user ? userId : null,
      name: isAnonymous ? null : name,
      email: isAnonymous ? null : email,
      amount,
      message,
      isAnonymous,
      status: "Pending",
      paymentMethod: null,
      orderId: "temp",
    });

    const orderId = `donation-${newDonation.id}-${moment().format(
      "YYYYMMDDHHmmss"
    )}`;

    await newDonation.update({ orderId });

    let parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: isAnonymous ? "Anonim" : name,
        email: isAnonymous ? "blank@gmail.com" : email,
      },
    };

    const snapToken = await snap.createTransaction(parameter);

    res.status(201).json({
      success: true,
      message: "Data donasi telah disimpan, lanjut ke pembayaran.",
      data: {
        donation: newDonation,
        orderId,
        snapToken: snapToken.token,
        redirectUrl: snapToken.redirect_url,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
