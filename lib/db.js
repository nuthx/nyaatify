import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { constants } from 'fs';
import { access, mkdir } from 'fs/promises';
import { logger } from "@/lib/logger";

const defaultConfigs = [
  ["username", "admin"],
  ["password", "password"],
  ["ai_priority", "local"],
  ["ai_api", ""],
  ["ai_key", ""],
  ["ai_model", ""],
  ["default_server", ""],
  ["show_server_state", "1"],
  ["title_priority", "jp,en,romaji,cn"],
  ["cover_source", "bangumi"]
];

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

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
        name_title TEXT,                       -- original name parsed from title with anitomy or ai (nyaa only)
        name_jp TEXT,                          -- japanese name
        name_cn TEXT,                          -- chinese name
        name_en TEXT,                          -- english name
        name_romaji TEXT,                      -- romaji name
        torrent TEXT NOT NULL,                 -- torrent link
        pub_date DATETIME,                     -- publish date
        size TEXT  NOT NULL,                   -- anime size
        category_id TEXT,                      -- category (nyaa only)
        cover_anilist TEXT,                    -- anilist cover image url
        cover_bangumi TEXT,                    -- bangumi cover image url
        link_anilist TEXT,                     -- anilist link
        link_bangumi TEXT,                     -- bangumi link
        created_at DATETIME                    -- anime created time
      );

      CREATE TABLE IF NOT EXISTS rss (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- id
        name TEXT UNIQUE NOT NULL,             -- rss name
        url TEXT NOT NULL,                     -- rss url
        type TEXT NOT NULL,                    -- rss type (Nyaa or Mikan)
        cron INTEGER NOT NULL,                 -- rss cron
        state TEXT,                            -- rss state (running or success)
        created_at DATETIME,                   -- rss created time
        last_refreshed_at DATETIME             -- rss last refreshed time
      );

      CREATE TABLE IF NOT EXISTS rss_anime (
        anime_hash TEXT NOT NULL,
        rss_id INTEGER NOT NULL,
        PRIMARY KEY (anime_hash, rss_id),
        FOREIGN KEY (anime_hash) REFERENCES anime(hash),
        FOREIGN KEY (rss_id) REFERENCES rss(id)
      );

      CREATE TABLE IF NOT EXISTS server (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- id
        name TEXT UNIQUE NOT NULL,             -- server name
        url TEXT UNIQUE NOT NULL,              -- server url
        type TEXT NOT NULL,                    -- server type (qBittorrent, Transmission or Aria2)
        username TEXT NOT NULL,                -- server username
        password TEXT NOT NULL,                -- server password
        created_at DATETIME,                   -- server created time
        cookie TEXT                            -- server cookie
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    // Insert default configs only if they don't exist
    // If certain config already exists, it will be ignored
    for (const [key, value] of defaultConfigs) {
      await dbInstance.run("INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)", [key, value]);
    }

    return dbInstance;
  } catch (error) {
    logger.error(error.message, { model: "getDb" });
    return null;
  }
}
