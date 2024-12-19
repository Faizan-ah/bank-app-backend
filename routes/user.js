const express = require("express");
const {
  registerUser,
  loginUser,
  getUser,
  getUserByCredentials,
  updateUser,
} = require("../controllers/user");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

// Register a user
router.post("/register", registerUser);

// Login a user
router.post("/login", loginUser);

// Get a user by ID
router.get("/reciever", getUserByCredentials);

// Get a user by ID
router.get("/:id", getUser);

// Get logged in user details
router.get("/", authenticateToken, getUser);

router.put("/", authenticateToken, updateUser);

module.exports = router;
