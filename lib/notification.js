import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function sendNotification(trigger, condition, redirect_url = null) {
  try {
    const db = await getDb();
    const notification = await db.all("SELECT * FROM notification");

    // Find all notifications that match the trigger
    const matchedNotifications = notification.filter(item => item.trigger === trigger);
    if (matchedNotifications.length === 0) {
      return;
    }

    for (const item of matchedNotifications) {
      // Check if the condition matches
      // If the condition is empty, it also matches
      if (item.condition && !item.condition.split(',').includes(condition)) {
        continue;
      }

      // Dispatch notification
      await dispatchNotification(item, redirect_url);
    }
  } catch (error) {
    logger.error(error.message, { model: "sendNotification" });
  }
}

export async function dispatchNotification(notification, redirect_url = null) {
  try {
    const notificationHandlers = {
      Bark: () => ({
        url: `${notification.url}/${notification.token}`,
        body: {
          title: notification.title,
          body: notification.message,
          ...(redirect_url && { url: redirect_url })
        }
      }),

      Gotify: () => ({
        url: `${notification.url}/message?token=${notification.token}`,
        body: {
          title: notification.title,
          message: notification.message,
          ...(redirect_url && { extras: { "client::notification": { "click": { "url": redirect_url } } } })
        }
      }),

      ServerChan: () => ({
        url: `${notification.url}/${notification.token}.send`,
        body: {
          title: notification.title,
          desp: notification.message
        }
      })
    };

    // Get handler and check if the type is valid
    const handler = notificationHandlers[notification.type];
    if (!handler) {
      throw new Error(`Invalid type: ${notification.type}, name: ${notification.name}`);
    }

    const { url, body } = handler();
    
    // Add extra parameters if exist
    let requestBody = body;
    if (notification.extra) {
      const extraParams = new URLSearchParams(notification.extra);
      for (const [key, value] of extraParams) {
        requestBody[key] = value;
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(requestBody)
    });

    // Throw error message if error occurs
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || data.errorDescription);
    }
    return {
      success: true,
      message: "success",
      data: null
    }
  } catch (error) {
    logger.error(error.message, { model: "dispatchNotification" });
    return {
      success: false,
      message: error.message,
      data: null
    }
  }
}
