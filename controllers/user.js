const jwt = require("jsonwebtoken");

const { hashPassword, comparePassword } = require("../utils/hashUtil");
const { createUser, findUserByPhone } = require("../services/user");
const {
  isValidPhoneNumber,
  isValidNIN,
  generateAccountNumber,
  doesUserExist,
} = require("../utils/registerUtil");

// Register user
const registerUser = async (req, res) => {
  const { first_name, last_name, nin, phone_number, password } = req.body;

  if (!first_name || !last_name || !nin || !phone_number || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if user already exists
    const userExists = await doesUserExist(phone_number, nin);
    if (userExists) {
      return res
        .status(400)
        .json({ message: "Phone number or NIN already exists." });
    }

    // Validate phone number
    if (!isValidPhoneNumber(phone_number)) {
      return res.status(400).json({ message: "Invalid phone number." });
    }

    // Validate NIN
    if (!isValidNIN(nin)) {
      return res.status(400).json({ message: "Invalid NIN format." });
    }

    // Generate a unique account number
    const account_number = await generateAccountNumber();

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Save user to the database
    const newUser = await createUser({
      first_name,
      last_name,
      nin,
      account_number,
      phone_number,
      password: hashedPassword,
      role: "user",
    });

    res
      .status(201)
      .json({ message: "User registered successfully!", user: newUser });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    return res
      .status(400)
      .json({ message: "phone and password are required." });
  }

  try {
    // Find user by phone
    const user = await findUserByPhone(phoneNumber);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: "1h" } // Expiration
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { registerUser, loginUser };
