// const express = require("express");
// const pool = require("./db");
// const port = process.env.PORT;

// const app = express();
// app.use(express.json());

// app.get("/", async (req, res) => {
//   try {
//     const data = await pool.query("SELECT * FROM users");
//     res.status(200).send(data.rows);
//   } catch (e) {
//     console.log(e);
//     res.sendStatus(500);
//   }
// });

// app.post("/", async (req, res) => {
//   const {
//     first_name,
//     last_name,
//     nin,
//     account_number,
//     phone_number,
//     password,
//     role,
//   } = req.body;

//   if (
//     !first_name ||
//     !last_name ||
//     !nin ||
//     !account_number ||
//     !phone_number ||
//     !password
//   ) {
//     return res.status(400).send({ message: "All fields are required." });
//   }

//   try {
//     const query = `
//       INSERT INTO users
//       (first_name, last_name, nin, account_number, phone_number, password, role)
//       VALUES ($1, $2, $3, $4, $5, $6, $7)
//       RETURNING *;
//     `;

//     const values = [
//       first_name,
//       last_name,
//       nin,
//       account_number,
//       phone_number,
//       password,
//       role || "user",
//     ];

//     const result = await pool.query(query, values);

//     res.status(201).send({
//       message: "User created successfully!",
//       user: result.rows[0],
//     });
//   } catch (e) {
//     console.error("Error creating user:", e);
//     res.sendStatus(500);
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log("Welcome to bank app!", port);
// });

const express = require("express");
const userRoutes = require("./routes/user");
const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);

// Start the server
app.listen(port, () => {
  console.log("Welcome to bank app!", port);
});
