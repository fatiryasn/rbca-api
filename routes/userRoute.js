const { body } = require("express-validator");
const {
  createUser,
  getAllUsers,
  changeUserChapter,
  changeUserActive,
  changeProfile,
  getUserById,
  getProfile,
  changeUserRole,
} = require("../controllers/userController");
const validateMiddleware = require("../middlewares/validateMiddleware");
const verifyToken = require("../middlewares/verifyToken");
const upload = require("../utils/multer");

const router = require("express").Router();

const createUserRules = [
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
    .optional()
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
    .trim()
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter"),

  body("role")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isIn(["Admin", "Supervisor", "Common"])
    .withMessage("Jenis role invalid"),

  body("chapterId")
    .if(body("role").equals("Supervisor"))
    .notEmpty()
    .withMessage("chapterId wajib diisi jika role Supervisor"),

  body("isActive")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isBoolean()
    .withMessage("Data isActive invalid"),
];

const changeRoleRules = [
  body("role")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isIn(["Admin", "Supervisor", "Common"])
    .withMessage("Jenis role invalid"),

  body("chapterId")
    .if(body("role").equals("Supervisor"))
    .notEmpty()
    .withMessage("Harus menyertakan id chapter apabila role adalah Supervisor"),
];

const changeActiveRules = [
  body("isActive")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap")
    .isBoolean()
    .withMessage("Data isActive invalid"),
];

const changeChapterRules = [
  body("chapterId")
    .notEmpty()
    .withMessage("Field yang dibutuhkan masih belum lengkap"),
];

const changeProfileRules = [
  body("username")
    .trim()
    .optional({ values: "falsy" })
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


//get all users ADMIN-SPVR
router.get("/user", verifyToken(["Admin", "Supervisor"]), getAllUsers);

//get profile ALL
router.get("/user/profile", verifyToken(), getProfile);

//edit profile ALL
router.put(
  "/user/profile",
  verifyToken(),
  upload.single("profilePicture"),
  changeProfileRules,
  validateMiddleware,
  changeProfile
);

//get user by id ADMIN-SPVR
router.get("/user/:id", verifyToken(["Admin", "Supervisor"]), getUserById);

//create user ADMIN-SPVR
router.post(
  "/user",
  verifyToken(["Admin", "Supervisor"]),
  createUserRules,
  validateMiddleware,
  createUser
);

//patch role ADMIN
router.patch(
  "/user/:id/role",
  verifyToken(["Admin"]),
  changeRoleRules,
  validateMiddleware,
  changeUserRole
);

//patch active ADMIN
router.patch(
  "/user/:id/active",
  verifyToken(["Admin"]),
  changeActiveRules,
  validateMiddleware,
  changeUserActive
);

//patch chapter ADMIN-SPVR
router.patch(
  "/user/:id/chapter",
  verifyToken(["Admin", "Supervisor"]),
  changeChapterRules,
  validateMiddleware,
  changeUserChapter
);

module.exports = router;
