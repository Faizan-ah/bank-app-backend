const twilio = require("twilio"); // Using Twilio as an example

const sendOtpToPhone = async (phone_number, otp) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const message = await client.messages.create({
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone_number,
    });

    console.log("OTP sent:", message.sid);
  } catch (err) {
    console.error("Error sending OTP:", err);
    throw new Error("Failed to send OTP.");
  }
};

// Generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendOtpToPhone, generateOtp };
