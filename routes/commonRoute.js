const { midtransNotif } = require("../controllers/commonController")

const router = require("express").Router()


//midtrans notif
router.post('/midtrans-notification', midtransNotif)


module.exports = router