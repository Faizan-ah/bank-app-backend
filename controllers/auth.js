const { sendOtpToPhone } = require("../utils/otpUtil"); // Utility to send OTP
const { generateOtp } = require("../utils/common");
const pool = require("../db");

// Send OTP to phone number
const sendOtp = async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  try {
    // Check if the phone number is valid
    if (!isValidPhoneNumber(phone_number)) {
      return res.status(400).json({ message: "Invalid phone number." });
    }

    // Check if the phone number is already associated with an existing user
    const user = await pool.query(
      "SELECT * FROM users WHERE phone_number = $1",
      [phone_number]
    );
    if (user.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "Phone number is already registered." });
    }

    // Generate OTP (you can use a simple 6-digit number)
    const otp = generateOtp();

    // Send OTP to phone number (use your preferred SMS service like Twilio, Nexmo, etc.)
    await sendOtpToPhone(phone_number, otp);

    // Store the OTP in your database or memory (with an expiration time)
    await pool.query(
      "INSERT INTO otp_requests (phone_number, otp) VALUES ($1, $2)",
      [phone_number, otp]
    );

    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { phone_number, otp } = req.body;

  if (!phone_number || !otp) {
    return res
      .status(400)
      .json({ message: "Phone number and OTP are required." });
  }

  try {
    // Check if the phone number is valid
    if (!isValidPhoneNumber(phone_number)) {
      return res.status(400).json({ message: "Invalid phone number." });
    }

    // Fetch OTP from the database
    const otpRecord = await pool.query(
      "SELECT * FROM otp_requests WHERE phone_number = $1 ORDER BY created_at DESC LIMIT 1",
      [phone_number]
    );

    if (otpRecord.rowCount === 0) {
      return res
        .status(400)
        .json({ message: "No OTP found for this phone number." });
    }

    const storedOtp = otpRecord.rows[0].otp;
    const otpCreatedAt = otpRecord.rows[0].created_at;

    // Validate OTP
    if (otp !== storedOtp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Check if OTP has expired (e.g., OTP valid for 5 minutes)
    const expirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    const currentTime = new Date().getTime();
    const otpAge = currentTime - new Date(otpCreatedAt).getTime();

    if (otpAge > expirationTime) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // OTP is valid, proceed with user registration or login
    res.status(200).json({ message: "OTP verified successfully!" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};
