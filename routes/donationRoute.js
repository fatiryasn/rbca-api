const { body } = require("express-validator");
const validateMiddleware = require("../middlewares/validateMiddleware");
const { createDonation, getAllDonations } = require("../controllers/DonationController");
const router = require("express").Router();

const createDonationRules = [
  body("userId").optional(),

  body("name")
    .if(body("isAnonymous").equals("false"))
    .notEmpty()
    .withMessage("Nama dan email wajib diisi jika tidak anonim")
    .isLength({ min: 3 })
    .withMessage("Nama terlalu pendek (min 3 karakter)")
    .isLength({ max: 30 })
    .withMessage("Nama terlalu panjang (max 30 karakter)"),

  body("email")
    .if(body("isAnonymous").equals("false"))
    .notEmpty()
    .withMessage("Nama dan email wajib diisi jika tidak anonim")
    .isEmail()
    .withMessage("Format email tidak valid"),

  body("amount")
    .notEmpty()
    .withMessage("Jumlah donasi wajib diisi")
    .isFloat({ gt: 0 })
    .withMessage("Jumlah donasi harus lebih besar dari 0"),

  body("message")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Pesan terlalu panjang (max 150 karakter)"),

  body("isAnonymous")
    .notEmpty()
    .withMessage("Wajib menyertakan anonim atau tidak")
    .isBoolean()
    .withMessage("Data isAnonymous invalid"),
];

//get all donation
router.get("/donation", getAllDonations)

//create new donation
router.post(
  "/donation",
  createDonationRules,
  validateMiddleware,
  createDonation
);

module.exports = router;
