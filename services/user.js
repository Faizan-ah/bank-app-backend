const pool = require("../db");

// Create a new user
const createUser = async (user) => {
  const {
    firstName,
    lastName,
    nin,
    accountNumber,
    phoneNumber,
    password,
    role,
    profilePicture,
  } = user;

  const query = `
    INSERT INTO users 
    (first_name, last_name, nin, account_number, phone_number, password, role, balance, profile_picture) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING *;
  `;

  const values = [
    firstName,
    lastName,
    nin,
    accountNumber,
    phoneNumber,
    password,
    role,
    100, //For testing purposes
    profilePicture,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Find user by NIN
const findUserByNin = async (nin) => {
  const query = `SELECT * FROM users WHERE nin = $1;`;
  const result = await pool.query(query, [nin]);
  return result.rows[0];
};

// Find user by NIN
const findUserByPhone = async (phone) => {
  const query = `SELECT * FROM users WHERE phone_number = $1;`;
  const result = await pool.query(query, [phone]);
  return result.rows[0];
};

// Find user by ID
const findUserById = async (id) => {
  const query = `SELECT * FROM users WHERE id = $1;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const findUserByIdentifier = async (
  recipientIdentifierType,
  recipientIdentifier
) => {
  let recipient;
  if (recipientIdentifierType === "phone") {
    recipient = await pool.query(
      "SELECT * FROM users WHERE phone_number = $1",
      [recipientIdentifier]
    );
  } else if (recipientIdentifierType === "nin") {
    recipient = await pool.query("SELECT * FROM users WHERE nin = $1", [
      recipientIdentifier,
    ]);
  } else {
    recipient = await pool.query(
      "SELECT * FROM users WHERE account_number = $1",
      [recipientIdentifier]
    );
  }

  return recipient.rows[0];
};

const updateUserDetails = async (userId, updates) => {
  const { first_name, last_name, profile_picture } = updates;

  const query = `
    UPDATE users
    SET 
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      profile_picture = $3,
      updated_at = NOW()
    WHERE id = $4
    RETURNING *;
  `;

  const values = [first_name, last_name, profile_picture, userId];

  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByNin,
  findUserByPhone,
  findUserByIdentifier,
  findUserById,
  updateUserDetails,
};
