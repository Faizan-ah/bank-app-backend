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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    //  Check sender exists and has enough balance
    const sender = await client.query("SELECT * FROM users WHERE id = $1", [
      senderId,
    ]);
    if (sender.rowCount === 0) {
      throw new Error("Sender not found.");
    }
    if (sender.rows[0].balance < amount) {
      throw new Error("Insufficient funds.");
    }

    // Find the recipient based on identifier type
    let recipient;
    if (recipientIdentifierType === "phone") {
      recipient = await client.query(
        "SELECT * FROM users WHERE phone_number = $1",
        [recipientIdentifier]
      );
    } else if (recipientIdentifierType === "nin") {
      recipient = await client.query("SELECT * FROM users WHERE nin = $1", [
        recipientIdentifier,
      ]);
    } else {
      recipient = await client.query(
        "SELECT * FROM users WHERE account_number = $1",
        [recipientIdentifier]
      );
    }
    if (recipient.rowCount === 0) {
      throw new Error("Recipient not found.");
    }

    // Deduct amount from sender
    const updateSender = await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance",
      [amount, senderId]
    );
    if (updateSender.rowCount === 0) {
      throw new Error("Failed to deduct sender balance.");
    }

    // Add amount to recipient
    const updateRecipient = await client.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance",
      [amount, recipient.rows[0].id]
    );
    if (updateRecipient.rowCount === 0) {
      throw new Error("Failed to update recipient balance.");
    }

    // Record the transaction
    const transaction = await client.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, transaction_date, status, transaction_type, message) VALUES ($1, $2, $3, NOW(), $4, $5, $6) RETURNING *",
      [senderId, recipient.rows[0].id, amount, "completed", "transfer", message]
    );
    const tran = transaction.rows[0];
    const transactionInfo = {
      id: tran.id,
      sender: sender.rows[0],
      recipient: recipient.rows[0],
      amount: tran.amount,
      transactionDate: tran.transaction_date,
      status: tran.status,
      transactionType: tran.transaction_type,
      message: tran.message,
    };

    await client.query("COMMIT");
    // Respond with transaction details
    res.status(200).json({
      message: "Transfer successful.",
      transactionInfo,
    });
  } catch (err) {
    await client.query("ROLLBACK"); // Undo all changes if an error occurs
    console.error("Transaction error:", err.message);
    res.status(500).json({ message: err.message || "Internal server error." });
  } finally {
    client.release(); // Release the database client
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
