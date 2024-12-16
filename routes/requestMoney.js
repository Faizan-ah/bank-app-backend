const express = require("express");
const {
  approveRequest,
  declineRequest,
  getMoneyRequests,
  requestMoney,
} = require("../controllers/requestMoney");

const router = express.Router();

router.post("/request-money", requestMoney);

router.post("/approve-request", approveRequest);

router.post("/decline-request", declineRequest);

router.get("/money-requests/:userId", getMoneyRequests);

module.exports = router;
