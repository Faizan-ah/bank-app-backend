const express = require("express");
const {
  approveRequest,
  declineRequest,
  getMoneyRequests,
  requestMoney,
} = require("../controllers/requestMoney");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/request-money", authenticateToken, requestMoney);

router.post("/approve-request", authenticateToken, approveRequest);

router.post("/decline-request", authenticateToken, declineRequest);

router.get("/money-requests", authenticateToken, getMoneyRequests);

module.exports = router;
