const express = require("express");
const {
  getTransactionDetails,
  initiateTransfer,
} = require("../controllers/transaction");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

// transfer amount
router.post("/transfer", initiateTransfer);

// get transaction details
router.get("/transaction/:id", authenticateToken, getTransactionDetails);

module.exports = router;
