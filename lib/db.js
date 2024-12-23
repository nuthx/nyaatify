import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { log } from "./log";

// Ensure the database connection is a singleton
let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  
  // Create database folder
  const dbDir = path.join(process.cwd(), "database");
  if (!existsSync(dbDir)) {
    try {
      await mkdir(dbDir, { recursive: true });
      log.info(`Database folder created successfully`);
    } catch (error) {
      log.error(`Failed to create database folder: ${error}`);
      throw error;
    }
  }

  try {
    dbInstance = await open({
      filename: path.join(dbDir, "core.db"),  // database/core.db
      driver: sqlite3.Database
    });

    // Create anime table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS anime (
        guid INTEGER PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        name_en TEXT,
        name_jp TEXT,
        torrent TEXT,
        download INTEGER,
        date DATETIME,
        size TEXT,
        hash TEXT,
        seeders INTEGER,
        leechers INTEGER,
        completed INTEGER,
        comments INTEGER,
        category TEXT,
        categoryId TEXT
      )
    `);

    // Create rss table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS rss (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        url TEXT UNIQUE NOT NULL,
        interval INTEGER NOT NULL
      )
    `);

    // Create anime_rss table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS anime_rss (
        anime_id INTEGER NOT NULL,
        rss_id INTEGER NOT NULL,
        PRIMARY KEY (anime_id, rss_id),
        FOREIGN KEY (anime_id) REFERENCES anime(guid),
        FOREIGN KEY (rss_id) REFERENCES rss(id)
      )
    `);

    // Create server table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS server (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        url TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        cookie TEXT
      )
    `);

    log.info(`Database created successfully`);
    return dbInstance;
  }

  catch (error) {
    log.error(`Failed to create database: ${error}`);
    throw error;
  }
}
