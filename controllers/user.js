const jwt = require("jsonwebtoken");

const { hashPassword, comparePassword } = require("../utils/hashUtil");
const {
  createUser,
  findUserByPhone,
  findUserById,
  findUserByIdentifier,
  updateUserDetails,
} = require("../services/user");
const {
  isValidPhoneNumber,
  isValidNIN,
  generateAccountNumber,
  doesUserExist,
} = require("../utils/registerUtil");

// Register user
const registerUser = async (req, res) => {
  const { firstName, lastName, nin, phoneNumber, password, profilePicture } =
    req.body;

  if (!firstName || !lastName || !nin || !phoneNumber || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if user already exists
    const userExists = await doesUserExist(phoneNumber, nin);
    if (userExists) {
      return res
        .status(400)
        .json({ message: "Phone number or NIN already exists." });
    }

    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number." });
    }

    // Validate NIN
    if (!isValidNIN(nin)) {
      return res.status(400).json({ message: "Invalid NIN format." });
    }

    if (password.length < 5) {
      return res.status(400).json({
        message: "Password must be at least 5 characters long.",
      });
    }

    // Generate a unique account number
    const accountNumber = await generateAccountNumber();

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Save user to the database
    const newUser = await createUser({
      firstName,
      lastName,
      nin,
      accountNumber,
      phoneNumber,
      password: hashedPassword,
      role: "user",
      profilePicture,
    });
    delete newUser.password;
    res
      .status(200)
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
      { expiresIn: process.env.JWT_EXPIRATION_TIME } // Expiration
    );
    delete user.password;
    const userDto = user;
    res.status(200).json({
      token,
      userDto,
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getUser = async (req, res) => {
  let userId;
  if (req.user) userId = req.user.id;
  else userId = req.params.id;
  try {
    // Find user by phone
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({
      user,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getUserByCredentials = async (req, res) => {
  const { phone, account, nin, identifier } = req.query;
  try {
    // Find user by phone
    let user;
    if (identifier === "phone")
      user = await findUserByIdentifier(identifier, phone);
    else if (identifier === "nin")
      user = await findUserByIdentifier(identifier, nin);
    else user = await findUserByIdentifier(identifier, account);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    delete user.password;

    res.status(200).json({
      user,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const updateUser = async (req, res) => {
  const { first_name, last_name, profile_picture } = req.body;
  const userId = req.user.id;

  try {
    // Check if user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update user details
    const updatedUser = await updateUserDetails(userId, {
      first_name,
      last_name,
      profile_picture,
    });

    res.status(200).json({
      message: "User updated successfully!",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  updateUser,
  getUserByCredentials,
};
