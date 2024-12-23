const { saveDeviceToken } = require("../services/user");

const saveToken = async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;

  console.log(token, userId);
  if (!token) {
    return res
      .status(400)
      .json({ message: "Push notification token is required." });
  }

  try {
    // Save the push token to the user's record in the database
    await saveDeviceToken(userId, token);

    res
      .status(200)
      .json({ message: "Push notification token saved successfully." });
  } catch (err) {
    console.error("Error saving device token:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  saveToken,
};
