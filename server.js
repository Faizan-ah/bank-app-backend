const express = require("express");
const userRoutes = require("./routes/user");
const transactionRoutes = require("./routes/transaction");
const requestMoneyRoutes = require("./routes/requestMoney");

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/", transactionRoutes);
app.use("/api/", requestMoneyRoutes);

// Start the server
app.listen(port, () => {
  console.log("Welcome to bank app!", port);
});
