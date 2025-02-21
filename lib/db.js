import path from "path";
import crypto from "crypto";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { constants } from "fs";
import { access, mkdir } from "fs/promises";
import { logger } from "@/lib/logger";

const defaultConfigs = [
  ["ai_priority", "local"],
  ["ai_api", ""],
  ["ai_key", ""],
  ["ai_model", ""],
  ["default_downloader", ""],
  ["show_downloader_state", "1"],
  ["title_priority", "jp,en,romaji,cn"],
  ["cover_source", "bangumi"]
];

let dbInstance = null;
let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;

  try {
    const dbDir = path.join(process.cwd(), "database");
    const dbFile = path.join(dbDir, "core.db");

    // Try to access database folder, if not exists, create it
    try {
      await access(dbDir, constants.F_OK);
    } catch {
      await mkdir(dbDir, { recursive: true });
    }

    // Open database
    // It will create database if not exists at the same time
    dbInstance = await open({
      filename: dbFile,
      driver: sqlite3.Database
    });

    // Create tables if not exists
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS anime (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- id
        hash TEXT UNIQUE NOT NULL,             -- anime hash
        title TEXT NOT NULL,                   -- original publish title
        name_title TEXT,                       -- original name parsed from title with anitomy or ai (mikan doesn't need it)
        name_jp TEXT,                          -- japanese name
        name_cn TEXT,                          -- chinese name
        name_en TEXT,                          -- english name
        name_romaji TEXT,                      -- romaji name
        torrent TEXT NOT NULL,                 -- torrent link
        pub_date DATETIME,                     -- publish date
        size TEXT NOT NULL,                    -- anime size
        category_id TEXT,                      -- category (nyaa item category id)
        cover_anilist TEXT,                    -- anilist cover image url
        cover_bangumi TEXT,                    -- bangumi cover image url
        link_anilist TEXT,                     -- anilist link
        link_bangumi TEXT,                     -- bangumi link
        created_at DATETIME                    -- created time
      );

      CREATE TABLE IF NOT EXISTS rss (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- id
        name TEXT UNIQUE NOT NULL,             -- rss name
        url TEXT NOT NULL,                     -- rss url
        type TEXT NOT NULL,                    -- rss type (Nyaa, Mikan)
        cron TEXT NOT NULL,                    -- rss cron
        state TEXT,                            -- rss state (running, success)
        created_at DATETIME,                   -- created time
        refresh_count INTEGER,                 -- refresh count (to avoid sending notification at first refresh)
        last_refreshed_at DATETIME             -- last refreshed time
      );

      CREATE TABLE IF NOT EXISTS rss_anime (
        anime_hash TEXT NOT NULL,
        rss_id INTEGER NOT NULL,
        PRIMARY KEY (anime_hash, rss_id),
        FOREIGN KEY (anime_hash) REFERENCES anime(hash),
        FOREIGN KEY (rss_id) REFERENCES rss(id)
      );

      CREATE TABLE IF NOT EXISTS downloader (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- id
        name TEXT UNIQUE NOT NULL,             -- downloader name
        url TEXT UNIQUE NOT NULL,              -- downloader url
        type TEXT NOT NULL,                    -- downloader type (qBittorrent, Transmission, Aria2)
        username TEXT NOT NULL,                -- downloader username
        password TEXT NOT NULL,                -- downloader password
        created_at DATETIME,                   -- downloader created time
        cookie TEXT                            -- downloader cookie
      );

      CREATE TABLE IF NOT EXISTS notification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- id
        name TEXT UNIQUE NOT NULL,             -- notification name
        filter TEXT,                           -- included items (empty means all)
        type TEXT NOT NULL,                    -- notification type
        url TEXT NOT NULL,                     -- notification url
        token TEXT NOT NULL,                   -- notification token
        title TEXT NOT NULL,                   -- notification title
        message TEXT NOT NULL,                 -- notification message
        extra TEXT,                            -- extra parameters on POST request
        state INTEGER NOT NULL,                -- send notification or not (0: disabled, 1: enabled)
        created_at DATETIME                    -- created time
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- id
        username TEXT UNIQUE NOT NULL,         -- username
        password TEXT NOT NULL,                -- hashed password
        created_at DATETIME,                   -- created time
        password_changed_at DATETIME           -- password changed time
      );

      CREATE TABLE IF NOT EXISTS device (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- id
        token TEXT UNIQUE NOT NULL,            -- auth_token
        user_id INTEGER NOT NULL,              -- user id
        browser TEXT,                          -- browser and version
        os TEXT,                               -- os and version
        ip TEXT,                               -- ip address
        created_at DATETIME,                   -- created time
        last_used_at DATETIME                  -- last used time
      );
    `);

    // Insert default configs
    // If certain config already exists, it will be ignored
    for (const [key, value] of defaultConfigs) {
      await dbInstance.run("INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)", [key, value]);
    }

    // Insert default user
    // If admin already exists, it will be ignored
    // Ensure only one admin user with ID=1 exists
    await dbInstance.run(
      "INSERT OR IGNORE INTO user (id, username, password, created_at) VALUES (1, ?, ?, ?)",
      [
        "admin",
        crypto.createHash("sha256").update("admin").digest("hex"),
        new Date().toISOString()
      ]
    );

    isInitialized = true;
    logger.info("Database initialized", { model: "initDb" });
    return dbInstance;
  } catch (error) {
    logger.error(error.message, { model: "initDb" });
    return null;
  }
}

export async function getDb() {
  try {
    if (!isInitialized) {
      await initDb();
    }
    return dbInstance;
  } catch (error) {
    logger.error(error.message, { model: "getDb" });
    return null;
  }
}

export async function getConfig() {
  try {
    const db = await getDb();
    return db.all("SELECT key, value FROM config").then(rows => 
      rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
    );
  } catch (error) {
    logger.error(error.message, { model: "getConfig" });
    return null;
  }
}
