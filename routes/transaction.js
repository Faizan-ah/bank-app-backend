const express = require("express");
const {
  getTransactionDetails,
  initiateTransfer,
} = require("../controllers/transaction");

const router = express.Router();

// transfer amount
router.post("/transfer", initiateTransfer);

// get transaction details
router.get("/transaction/:id", getTransactionDetails);

module.exports = router;
