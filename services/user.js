const pool = require("../db");

// Create a new user
const createUser = async (user) => {
  const {
    first_name,
    last_name,
    nin,
    account_number,
    phone_number,
    password,
    role,
  } = user;

  const query = `
    INSERT INTO users 
    (first_name, last_name, nin, account_number, phone_number, password, role, balance) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
    RETURNING *;
  `;

  const values = [
    first_name,
    last_name,
    nin,
    account_number,
    phone_number,
    password,
    role,
    100, //For testing purposes
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

module.exports = { createUser, findUserByNin, findUserByPhone };
