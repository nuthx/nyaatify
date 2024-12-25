import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { mkdir } from "fs/promises";
import { log } from "./log";

let dbInstance = null;

async function createTables(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS anime (
      id INTEGER PRIMARY KEY AUTOINCREMENT,  -- id
      guid TEXT UNIQUE NOT NULL,             -- nyaa: guid, mikan: link id
      title TEXT NOT NULL,                   -- original publish title
      name_title TEXT,                       -- original name parsed from title by anitomy or gpt (nyaa only)
      name_jp TEXT,                          -- japanese name
      name_cn TEXT,                          -- chinese name
      name_en TEXT,                          -- english name
      cover TEXT,                            -- cover image url from anilist api or mikan
      torrent TEXT NOT NULL,                 -- torrent link
      server_id INTEGER,                     -- download server id. 0 is not downloaded
      pub_date DATETIME,                     -- publish date
      size TEXT  NOT NULL,                   -- anime size
      category_id TEXT,                      -- category (nyaa only)
      anilist_link TEXT,                     -- anilist link (nyaa only)
      bangumi_link TEXT                      -- bangumi link (mikan only)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rss (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      interval INTEGER NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS anime_rss (
      anime_id INTEGER NOT NULL,
      rss_id INTEGER NOT NULL,
      PRIMARY KEY (anime_id, rss_id),
      FOREIGN KEY (anime_id) REFERENCES anime(id),
      FOREIGN KEY (rss_id) REFERENCES rss(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS server (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      url TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      cookie TEXT,
      cookie_expiry DATETIME
    )
  `);
}

export async function getDb() {
  if (dbInstance) return dbInstance;
  
  // Create database folder
  const dbDir = path.join(process.cwd(), "database");
  await mkdir(dbDir, { recursive: true });

  try {
    dbInstance = await open({
      filename: path.join(dbDir, "core.db"),  // database/core.db
      driver: sqlite3.Database
    });

    // Check if tables exist
    const tableCheck = await dbInstance.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='anime'"
    );

    // Create tables
    if (!tableCheck) {
      await createTables(dbInstance);
      log.info(`Database created successfully`);
    }

    return dbInstance;
  }

  catch (error) {
    log.error(`Failed to create database: ${error.message}`);
    throw error.message;
  }
}
