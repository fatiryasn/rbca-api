const { Op } = require("sequelize");
const { Chapter, Donation, User, UsernameChangeLog } = require("../models");
const bcrypt = require("bcrypt");
const moment = require("moment");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

//get all users
exports.getAllUsers = async (req, res) => {
  try {
    let { page, limit, isActive, role, chapterId, search, sort } = req.query;

    page = page ? parseInt(page, 10) : 1;
    limit = limit ? parseInt(limit, 10) : 30;

    if (![30, 50, 80].includes(limit)) {
      limit = 30;
    }

    const offset = (page - 1) * limit;

    const whereClause = {};

    if (typeof isActive !== "undefined") {
      if (isActive === "true") whereClause.isActive = true;
      else if (isActive === "false") whereClause.isActive = false;
    }

    if (["Admin", "Supervisor", "Common"].includes(role)) {
      whereClause.role = role;
    }

    if (chapterId && !isNaN(chapterId)) {
      whereClause.chapterId = parseInt(chapterId, 10);
    }

    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    let order = [["createdAt", "DESC"]];
    if (sort === "oldest") {
      order = [["createdAt", "ASC"]];
    } else if (sort === "az") {
      order = [["username", "ASC"]];
    } else if (sort === "za") {
      order = [["username", "DESC"]];
    }

    const { rows: users, count: totalItems } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order,
      attributes: [
        "id",
        "username",
        "name",
        "email",
        "role",
        "isActive",
        "authProvider",
        "chapterId",
        "profilePicture",
        "createdAt",
        "updatedAt",
      ],
    });

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: users,
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

//get user by id
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "name",
        "email",
        "profilePicture",
        "authProvider",
        "isActive",
        "isComplete",
        "role",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: Donation,
          attributes: [
            "id",
            "userId",
            "name",
            "email",
            "amount",
            "createdAt",
            "updatedAt",
          ],
        },
        {
          model: Chapter,
          attributes: ["id", "name", "address", "city", "province"],
        },
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    return res.status(200).json({
      success: true,
      message: "User ditemukan",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "name",
        "email",
        "profilePicture",
        "isActive",
        "isComplete",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: Donation,
          attributes: [
            "id",
            "userId",
            "name",
            "email",
            "amount",
            "createdAt",
            "updatedAt",
          ],
        },
        {
          model: Chapter,
          attributes: ["id", "name", "address", "city", "province"],
        },
      ],
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Akun ini tidak aktif" });
    }
    if (!user.isComplete) {
      return res.status(409).json({
        success: false,
        message: "Akun ini masih dalam tahap pembuatan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User ditemukan",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//create user
exports.createUser = async (req, res) => {
  try {
    let { username, name, email, password, chapterId, isActive, role } =
      req.body;

    const existsUsername = await User.findOne({ where: { username } });
    if (existsUsername) {
      return res.status(409).json({
        success: false,
        message: "Username sudah dipakai, silahkan gunakan username lain",
      });
    }

    const existsEmail = await User.findOne({ where: { email } });
    if (existsEmail) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar, silahkan gunakan email lain",
      });
    }

    const existsChapter = await Chapter.findByPk(chapterId);
    if (!existsChapter) {
      chapterId = null;
      if (role === "Supervisor") {
        return res.status(400).json({
          success: false,
          message:
            "Harus menyertakan id chapter apabila role adalah Supervisor",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.toLowerCase(),
      name,
      email,
      password: hashedPassword,
      role,
      authProvider: "Local",
      chapterId,
      isActive,
      isComplete: true,
    });

    res.json({
      success: true,
      message: "User berhasil ditambahkan",
      data: {
        name: newUser.name,
        email: newUser.email,
        authProvider: newUser.authProvider,
        role: newUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//change role
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    let { role, chapterId } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    if (user.authProvider === "Google" || user.password === null) {
      return res.status(400).json({
        success: false,
        message:
          "Autentikasi akun berasal dari google, tidak dapat mengganti role",
      });
    }

    const existsChapter = await Chapter.findByPk(chapterId);
    if (!existsChapter) {
      if (role === "Supervisor") {
        return res.status(400).json({
          success: false,
          message:
            "Harus menyertakan id chapter apabila role adalah Supervisor",
        });
      }
      chapterId = null;
    }
    if (role === "Admin") {
      chapterId = null;
    }

    user.role = role;
    user.chapterId = chapterId;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Role user berhasil diperbarui",
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        chapterId: user.chapterId,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//change active
exports.changeUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User berhasil ${isActive ? "diaktifkan" : "dinonaktifkan"}`,
      data: {
        id: user.id,
        username: user.username,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//change chapter
exports.changeUserChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { chapterId } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    if (user.role === "Admin") {
      return res.status(400).json({
        success: false,
        message: "Role user adalah Admin, tidak dapat mengubah data chapter",
      });
    }

    const existsChapter = await Chapter.findByPk(chapterId);
    if (!existsChapter) {
      return res
        .status(404)
        .json({ success: false, message: "ID Chapter tidak ditemukan" });
    }

    user.chapterId = chapterId;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Chapter user berhasil diperbarui",
      data: {
        id: user.id,
        username: user.username,
        chapterId: user.chapterId,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//change profile
exports.changeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, name, profilePicture } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    // username
    if (username && username !== user.username) {
      const existingUser = await User.findOne({
        where: { username, id: { [Op.ne]: userId } },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username sudah digunakan oleh pengguna lain",
        });
      }
      const sevenDaysAgo = moment().subtract(7, "days").toDate();
      const countChanges = await UsernameChangeLog.count({
        where: {
          userId,
          createdAt: { [Op.gte]: sevenDaysAgo },
        },
      });

      if (countChanges >= 2) {
        return res.status(400).json({
          success: false,
          message:
            "Username hanya bisa diganti maksimal 2 kali dalam 7 hari terakhir",
        });
      }

      user.username = username;

      await UsernameChangeLog.create({
        userId,
        username,
      });
    }

    // name
    if (name && name !== user.name) {
      user.name = name;
    }

    // profile picture
    if (req.file) {
      if (user.profilePicturePublicId) {
        await cloudinary.uploader.destroy(user.profilePicturePublicId);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "rbca-pfp",
      });

      user.profilePicture = result.secure_url;
      user.profilePicturePublicId = result.public_id;

      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Gagal hapus file:", err);
      });
    } else if (!profilePicture && user.profilePicturePublicId) {
      await cloudinary.uploader.destroy(user.profilePicturePublicId);
      user.profilePicture = null;
      user.profilePicturePublicId = null;
    }


    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: {
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
