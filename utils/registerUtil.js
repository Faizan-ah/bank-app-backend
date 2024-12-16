const pool = require("../db");

const isValidPhoneNumber = (phoneNumber) => {
  // The phone number can optionally start with a plus sign (+)
  // must be between 10 and 15 digits long
  // only contain numeric digits (0-9)
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  return phoneRegex.test(phoneNumber);
};

const generateAccountNumber = async () => {
  const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000); // Generate 10-digit number

  const existingUser = await pool.query(
    "SELECT * FROM users WHERE account_number = $1",
    [accountNumber]
  );

  if (existingUser.rowCount > 0) {
    return generateAccountNumber();
  }

  return accountNumber;
};

const isValidNIN = (nin) => {
  // The NIN can contain uppercase letters (A-Z) and numbers (0-9).
  // The length of the NIN must be between 10 to 12 characters.
  const ninRegex = /^[A-Z0-9]{10,12}$/;
  return ninRegex.test(nin);
};

const doesUserExist = async (phone_number, nin) => {
  // Check if phone number or NIN already exists
  const existingUser = await pool.query(
    "SELECT * FROM users WHERE phone_number = $1 OR nin = $2",
    [phone_number, nin]
  );

  return existingUser.rowCount > 0;
};

module.exports = {
  isValidPhoneNumber,
  isValidNIN,
  generateAccountNumber,
  doesUserExist,
};
