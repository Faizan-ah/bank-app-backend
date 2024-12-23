const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    console.error("Full error:", error); // Logs full error for debugging
  }
})();
module.exports = pool;
