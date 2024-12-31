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
      hash TEXT UNIQUE NOT NULL,             -- anime hash
      title TEXT NOT NULL,                   -- original publish title
      name_title TEXT,                       -- original name parsed from title by anitomy or gpt (nyaa only)
      name_jp TEXT,                          -- japanese name
      name_cn TEXT,                          -- chinese name
      name_en TEXT,                          -- english name
      name_romaji TEXT,                      -- romaji name
      torrent TEXT NOT NULL,                 -- torrent link
      server_id INTEGER,                     -- download server id. 0 is not downloaded
      pub_date DATETIME,                     -- publish date
      size TEXT  NOT NULL,                   -- anime size
      category_id TEXT,                      -- category (nyaa only)
      cover_anilist TEXT,                    -- cover image url from anilist
      cover_bangumi TEXT,                    -- cover image url from bangumi
      link_anilist TEXT,                     -- anilist link
      link_bangumi TEXT                      -- bangumi link
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rss (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      cron INTEGER NOT NULL,
      state TEXT,
      created_at DATETIME,
      last_refreshed_at DATETIME
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rss_anime (
      anime_hash TEXT NOT NULL,
      rss_id INTEGER NOT NULL,
      PRIMARY KEY (anime_hash, rss_id),
      FOREIGN KEY (anime_hash) REFERENCES anime(hash),
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
      version TEXT,
      created_at DATETIME,
      cookie TEXT
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
