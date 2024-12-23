export const sendUserNotification = async (body) => {
  const { pushToken, title, message, data } = body;

  if (!pushToken || !title || !message) {
    throw new Error({
      success: false,
      message: "Missing pushToken, title, or message",
    });
  }

  if (!pushToken.startsWith("ExponentPushToken")) {
    throw new Error({
      success: false,
      message: "Invalid Expo push token",
    });
  }

  try {
    const notificationPayload = {
      to: pushToken,
      title: title,
      body: message,
      data,
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();
    if (response.ok) {
      return {
        success: true,
        message: "Notification sent successfully",
        result,
      };
    } else {
      throw new Error({
        success: false,
        message: "Error sending notification",
        error: result,
      });
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
