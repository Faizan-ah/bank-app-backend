const pool = require("../db");

const saveDeviceToken = async (userId, token) => {
  try {
    // Check if the user already has a token saved
    const existingToken = await pool.query(
      "SELECT * FROM device_tokens WHERE user_id = $1",
      [userId]
    );

    if (existingToken.rowCount > 0) {
      // Update existing token
      await pool.query(
        "UPDATE device_tokens SET token = $1, updated_at = NOW() WHERE user_id = $2",
        [token, userId]
      );
    } else {
      // Insert new token
      await pool.query(
        "INSERT INTO device_tokens (user_id, token) VALUES ($1, $2)",
        [userId, token]
      );
    }
  } catch (err) {
    console.error("Error saving device token:", err);
    throw err;
  }
};

module.exports = {
  saveDeviceToken,
};
