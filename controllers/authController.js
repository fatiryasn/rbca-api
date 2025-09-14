const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createAccessToken, createRefreshToken } = require("../utils/tokens");

//login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Akun ini tidak aktif, tidak dapat login dengan akun ini.",
      });
    }
    if (user.authProvider !== "Local") {
      return res
        .status(401)
        .json({ success: false, message: "Kredensial autentikasi invalid" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }

    //token
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.toLowerCase(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "Common",
      authProvider: "Local",
      isComplete: true,
    });

    res.json({
      success: true,
      message: "Akun berhasil dibuat, hanya perlu login untuk melanjutkan",
      data: {
        name: newUser.name,
        email: newUser.email,
        authProvider: newUser.authProvider,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { email, profilePicture } = req.body;

    const user = await User.findOne({ where: { email } });
    //login
    if (user) {
      if (user.authProvider !== "Google") {
        return res
          .status(403)
          .json({ success: false, message: "Kredensial autentikasi invalid" });
      }

      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          authProvider: user.authProvider,
        },
        accessToken,
      });
      //register
    } else {
      const newUser = await User.create({
        username: `temp${Date.now()}${Math.floor(Math.random() * 1000)}`,
        name: `temp${Date.now()}`,
        email,
        profilePicture,
        role: "Common",
        authProvider: "Google",
        isComplete: false,
      });

      const accessToken = createAccessToken(newUser);
      const refreshToken = createRefreshToken(newUser);

      newUser.refreshToken = refreshToken;
      await newUser.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message:
          "Berhasil membuat akun, hanya perlu mengisi username dan nama akun anda",
        data: {
          id: newUser.id,
          email: newUser.email,
          authProvider: newUser.authProvider,
        },
        accessToken,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeGoogleAcc = async (req, res) => {
  try {
    const { username, name } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    if (user.isComplete) {
      return res
        .status(400)
        .json({ success: false, message: "Status data akun sudah complete" });
    }

    const existsUsername = await User.findOne({ where: { username } });
    if (existsUsername) {
      return res.status(409).json({
        success: false,
        message: "Username sudah dipakai, silahkan gunakan username lain",
      });
    }

    user.username = username;
    user.name = name;
    user.isComplete = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profil berhasil dilengkapi",
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        isComplete: user.isComplete,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.token = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const user = await User.findOne({ where: { refreshToken } });
    if (!user) return res.sendStatus(403);

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) return res.sendStatus(403);
        const newAccessToken = createAccessToken(user);
        res.status(200).json({ success: true, accessToken: newAccessToken });
      }
    );
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const user = await User.findOne({ where: { refreshToken } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan atau mungkin sudah logout",
      });
    }
    user.refreshToken = null;
    user.save();

    res.clearCookie("refreshToken");
    return res.status(200).json({ success: true, message: "Logout berhasil" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
