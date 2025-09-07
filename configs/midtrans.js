const midtransClient = require("midtrans-client");

//snap
let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});


module.exports = { snap };
