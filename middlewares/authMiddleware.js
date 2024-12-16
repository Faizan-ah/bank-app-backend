const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  // Extract token from the Authorization header
  const token = req.headers["authorization"]?.split(" ")[1]; // Assuming Bearer token

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authorization token is required." });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    // Attach user info to the request object
    req.user = decoded;
    next(); // Proceed to the next middleware/route handler
  });
};

module.exports = authenticateToken;
