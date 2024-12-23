const express = require("express");
const { saveToken } = require("../controllers/deviceToken");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/save-token", authenticateToken, saveToken);

module.exports = router;
