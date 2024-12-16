const pool = require("../db");

const initiateTransfer = async (req, res) => {
  const {
    senderId,
    recipientIdentifier,
    amount,
    recipientIdentifierType,
    message,
  } = req.body;

  if (
    !senderId ||
    !recipientIdentifier ||
    !amount ||
    !recipientIdentifierType
  ) {
    return res.status(400).json({
      message: "Sender, recipient account with type, and amount are required.",
    });
  }

  try {
    // 1. Check if the sender exists and has enough balance
    const sender = await pool.query("SELECT * FROM users WHERE id = $1", [
      senderId,
    ]);
    if (sender.rowCount === 0) {
      return res.status(404).json({ message: "Sender not found." });
    }

    if (sender.rows[0].balance < amount) {
      return res.status(400).json({ message: "Insufficient funds." });
    }

    // 2. Find recipient based on phone number, NIN, or account number
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

    if (recipient.rowCount === 0) {
      return res.status(404).json({ message: "Recipient not found." });
    }
    // Deduct amount from sender's balance
    await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [
      amount,
      senderId,
    ]);

    // Add amount to recipient's balance
    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [
      amount,
      recipient.rows[0].id,
    ]);

    // Record the transaction
    await pool.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, transaction_date, status, transaction_type, message) VALUES ($1, $2, $3, NOW(), $4, $5, $6)",
      [senderId, recipient.rows[0].id, amount, "completed", "transfer", message]
    );

    res.status(200).json({ message: "Transfer successful." });
  } catch (err) {
    console.error("Error initiating transfer:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getTransactionDetails = async (req, res) => {
  const { id } = req.params;

  // The user ID from the token (added by the middleware)
  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({ message: "Transaction ID is required." });
  }

  try {
    // Fetch the transaction details from the database
    const transaction = await pool.query(
      "SELECT * FROM transactions WHERE id = $1",
      [id]
    );

    if (transaction.rowCount === 0) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    const transactionDetails = transaction.rows[0];

    // Check if the user is the sender or receiver of the transaction
    if (
      transactionDetails.sender_id !== userId &&
      transactionDetails.receiver_id !== userId
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this transaction." });
    }

    res.status(200).json({ transaction: transactionDetails });
  } catch (err) {
    console.error("Error fetching transaction details:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};
module.exports = { initiateTransfer, getTransactionDetails };
