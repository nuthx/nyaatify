import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function sendNotification(rssName, anime) {
  try {
    const db = await getDb();
    const notifications = await db.all("SELECT * FROM notification");

    for (const notification of notifications) {
      // Check if the filter matches
      // If the filter is empty, it also matches
      if (notification.filter && !notification.filter.split(',').includes(rssName)) {
        continue;
      }

      // Check if the notification is enabled
      if (notification.state === 0) {
        continue;
      }

      // Convert the original anime key name to variable key name
      const variable = {
        rss: rssName,
        title_original: anime.title,
        title_jp: anime.name_jp,
        title_cn: anime.name_cn,
        title_en: anime.name_en,
        title_romaji: anime.name_romaji,
        torrent_link: anime.torrent,
        torrent_hash: anime.hash,
        torrent_size: anime.size,
        cover_anilist: anime.cover_anilist,
        cover_bangumi: anime.cover_bangumi,
        link_anilist: anime.link_anilist,
        link_bangumi: anime.link_bangumi
      }

      // Dispatch notification
      await dispatchNotification(notification, variable);
    }
  } catch (error) {
    logger.error(error.message, { model: "sendNotification" });
  }
}

export async function dispatchNotification(notification, variable, redirect = null) {
  try {
    // Replace custom variables
    // If the variable is not found, return empty
    const replaceVariables = (str) => {
      return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        return variable[key] || "";
      });
    };

    const notificationHandlers = {
      Bark: () => ({
        url: `${notification.url}/${notification.token}`,
        body: {
          title: replaceVariables(notification.title),
          body: replaceVariables(notification.message),
          ...(redirect && { url: redirect })
        }
      }),

      Gotify: () => ({
        url: `${notification.url}/message?token=${notification.token}`,
        body: {
          title: replaceVariables(notification.title),
          message: replaceVariables(notification.message),
          ...(redirect && { extras: { "client::notification": { "click": { "url": redirect } } } })
        }
      }),

      ServerChan: () => ({
        url: `${notification.url}/${notification.token}.send`,
        body: {
          title: replaceVariables(notification.title),
          desp: replaceVariables(notification.message)
        }
      })
    };

    // Get handler and check if the type is valid
    const handler = notificationHandlers[notification.type];
    if (!handler) {
      throw new Error(`Invalid type: ${notification.type}, name: ${notification.name}`);
    }

    const { url, body } = handler();
    
    // Add extra parameters if exist and replace variables in values
    let requestBody = body;
    if (notification.extra) {
      const extraParams = new URLSearchParams(replaceVariables(notification.extra));
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
