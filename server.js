const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/user");
const transactionRoutes = require("./routes/transaction");
const requestMoneyRoutes = require("./routes/requestMoney");

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Use CORS
app.use(cors());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/", transactionRoutes);
app.use("/api/", requestMoneyRoutes);

//TODO: divide into services

// Start the server
app.listen(port, () => {
  console.log("Welcome to bank app!", port);
});
