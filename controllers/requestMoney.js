const pool = require("../db");

const notificationSender = require("../utils/notification");

const requestMoney = async (req, res) => {
  const { recipientPhone, amount } = req.body;
  const requesterId = req.user.id;

  if (!recipientPhone || !amount) {
    return res.status(400).json({
      message: "Recipient phone number and amount are required.",
    });
  }

  try {
    const requester = await pool.query("SELECT * FROM users WHERE id = $1", [
      requesterId,
    ]);
    if (requester.rowCount === 0) {
      return res.status(404).json({ message: "Requester not found." });
    }

    const recipient = await pool.query(
      "SELECT * FROM users WHERE phone_number = $1",
      [recipientPhone]
    );

    if (recipient.rowCount === 0) {
      return res.status(404).json({ message: "Recipient not found." });
    }

    if (recipient.rows[0].id === requesterId) {
      return res
        .status(400)
        .json({ message: "Recipient and Requester can't be the same." });
    }

    // Insert the money request
    await pool.query(
      "INSERT INTO money_requests (requester_id, recipient_id, amount, status) VALUES ($1, $2, $3, 'pending')",
      [requesterId, recipient.rows[0].id, amount]
    );

    // Fetch the recipient's device tokens
    const tokensResult = await pool.query(
      "SELECT token FROM device_tokens WHERE user_id = $1",
      [recipient.rows[0].id]
    );

    const token = tokensResult.rows[0].token;
    console.log(token);
    if (token.length > 0) {
      const payload = {
        pushToken: token,
        title: "Money Request",
        data: { type: "money_request", amount },
        message: `${requester.rows[0].first_name} ${requester.rows[0].last_name} requested $${amount}.`,
      };

      const response = notificationSender.sendUserNotification(payload);
      console.log("Push Notification Response:", response);
    }

    res.status(200).json({ message: "Money request sent successfully." });
  } catch (err) {
    console.error("Error requesting money:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const approveRequest = async (req, res) => {
  const { requestId } = req.body;
  const recipientId = req.user.id;

  if (!requestId) {
    return res.status(400).json({
      message: "Request ID is required.",
    });
  }

  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query("BEGIN");

    const request = await client.query(
      "SELECT * FROM money_requests WHERE id = $1 AND recipient_id = $2 AND status = 'pending'",
      [requestId, recipientId]
    );

    if (request.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Request not found or already approved/declined." });
    }

    const recipient = await client.query("SELECT * FROM users WHERE id = $1", [
      recipientId,
    ]);

    if (recipient.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Recipient not found." });
    }

    if (Number(recipient.rows[0].balance) < Number(request.rows[0].amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient funds." });
    }

    const requester = await client.query("SELECT * FROM users WHERE id = $1", [
      request.rows[0].requester_id,
    ]);

    // Proceed with the transfer and update balances
    await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [request.rows[0].amount, recipientId]
    );

    await client.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2",
      [request.rows[0].amount, requester.rows[0].id]
    );

    // Record the transaction
    const transactionResult = await client.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, transaction_date, status, transaction_type) VALUES ($1, $2, $3, NOW(), 'completed', 'request_transfer') RETURNING *",
      [recipientId, requester.rows[0].id, request.rows[0].amount]
    );

    const newTransaction = transactionResult.rows[0];

    // Update the request status to 'approved'
    await client.query(
      "UPDATE money_requests SET status = 'approved', updated_at = NOW() WHERE id = $1",
      [requestId]
    );

    // Commit the transaction
    await client.query("COMMIT");

    res.status(200).json({
      message: "Money request approved and transfer completed.",
      transaction: newTransaction,
    });
  } catch (err) {
    // Rollback the transaction on error
    await client.query("ROLLBACK");
    console.error("Error approving request:", err);
    res.status(500).json({ message: "Internal server error." });
  } finally {
    // Release the client back to the pool
    client.release();
  }
};

const declineRequest = async (req, res) => {
  const { requestId } = req.body;
  const recipientId = req.user.id;

  if (!requestId) {
    return res.status(400).json({
      message: "Request ID is required.",
    });
  }

  try {
    // Fetch the money request by ID for the recipient
    const request = await pool.query(
      "SELECT * FROM money_requests WHERE id = $1 AND recipient_id = $2 AND status = 'pending'",
      [requestId, recipientId]
    );
    if (request.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Request not found or already processed." });
    }

    // Update the request status to 'declined'
    await pool.query(
      "UPDATE money_requests SET status = 'declined', updated_at = NOW() WHERE id = $1",
      [requestId]
    );

    res.status(200).json({ message: "Money request declined." });
  } catch (err) {
    console.error("Error declining request:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getMoneyRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch all pending requests for the user (as a recipient) along with requester names
    const requests = await pool.query(
      `SELECT 
        mr.id, 
        mr.amount, 
        mr.created_at, 
        mr.updated_at, 
        mr.recipient_id, 
        mr.requester_id, 
        mr.status, 
        CONCAT(u.first_name, ' ', u.last_name) AS requester_name,
        u.account_number AS account_number
      FROM 
        money_requests mr
      JOIN 
        users u
      ON 
        mr.requester_id = u.id
      WHERE 
        mr.recipient_id = $1 AND mr.status = 'pending'`,
      [userId]
    );

    if (requests.rowCount === 0) {
      return res.status(200).json({ message: "No pending money requests." });
    }

    res.status(200).json({ requests: requests.rows });
  } catch (err) {
    console.error("Error fetching money requests:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  approveRequest,
  declineRequest,
  getMoneyRequests,
  requestMoney,
};
