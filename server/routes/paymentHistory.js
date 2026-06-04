const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/paymentHistoryController");

router.get("/", ctrl.getPaymentHistory);
router.delete("/:id", ctrl.deletePaymentHistory);

module.exports = router;
