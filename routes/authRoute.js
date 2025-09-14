const { body } = require("express-validator");
const validateMiddleware = require("../middlewares/validateMiddleware");
const {
  login,
  googleAuth,
  logout,
  token,
  register,
  completeGoogleAcc,
} = require("../controllers/authController");
const verifyToken = require("../middlewares/verifyToken");

const router = require("express").Router();

const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isEmail()
    .withMessage("Format email tidak valid"),

  body("password")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),
];

const registerRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isAlphanumeric()
    .withMessage("Username hanya boleh berisi huruf dan angka")
    .isLength({ min: 5 })
    .withMessage("Username terlalu pendek (min 5 karakter)")
    .isLength({ max: 16 })
    .withMessage("Username terlalu panjang (max 16 karakter)"),

  body("name")
    .trim()
    .optional({ values: "falsy" })
    .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/)
    .withMessage("Format nama tidak valid")
    .isLength({ min: 3 })
    .withMessage("Nama terlalu pendek (min 3 karakter)")
    .isLength({ max: 30 })
    .withMessage("Nama terlalu panjang (max 30 karakter)"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isEmail()
    .withMessage("Format email tidak valid"),

  body("password")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter"),
];

const googleAuthRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isEmail()
    .withMessage("Format email tidak valid"),

  body("profilePicture").optional().isURL().withMessage("URL foto tidak valid"),
];

const completeGoogleRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isAlphanumeric()
    .withMessage("Username hanya boleh berisi huruf dan angka")
    .isLength({ min: 5 })
    .withMessage("Username terlalu pendek (min 5 karakter)")
    .isLength({ max: 16 })
    .withMessage("Username terlalu panjang (max 16 karakter)"),

  body("name")
    .trim()
    .optional({ values: "falsy" })
    .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/)
    .withMessage("Format nama tidak valid")
    .isLength({ min: 3 })
    .withMessage("Nama terlalu pendek (min 3 karakter)")
    .isLength({ max: 30 })
    .withMessage("Nama terlalu panjang (max 30 karakter)"),
];

//login
router.post("/login", loginRules, validateMiddleware, login);

//register
router.post("/register", registerRules, validateMiddleware, register);

//google auth
router.post("/google-auth", googleAuthRules, validateMiddleware, googleAuth);

//complete google acc
router.post(
  "/complete-google",
  verifyToken(),
  completeGoogleRules,
  validateMiddleware,
  completeGoogleAcc
);

//refresh token
router.get("/token", token);

//logout
router.delete("/logout", logout);

module.exports = router;
