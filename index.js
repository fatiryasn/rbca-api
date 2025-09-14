require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sequelize = require("./configs/database");

const donationRoute = require("./routes/donationRoute")
const commonRoute = require("./routes/commonRoute")
const authRoute = require("./routes/authRoute")
const userRoute = require("./routes/userRoute")

const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: true }));

app.use("/api", donationRoute)
app.use("/api", commonRoute)
app.use("/api/auth", authRoute)
app.use ("/api", userRoute)

app.get("/", (req, res) => {
  res.send("Rumah Baca API");
});

app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);

  try {
    await sequelize.authenticate();
    console.log("✅ Koneksi ke database berhasil");

    await sequelize.sync();
    console.log("🛠️ Model disinkronkan ke database");
  } catch (err) {
    console.error("❌ Gagal koneksi atau sync database:", err);
  }
});
