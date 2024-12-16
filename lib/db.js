import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Ensure the database connection is a singleton
let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  
  // Create database folder
  const dbDir = path.join(process.cwd(), 'database');
  if (!existsSync(dbDir)) {
    try {
      await mkdir(dbDir, { recursive: true });
      console.log('Database folder created successfully');
    } catch (err) {
      console.error('Failed to create database folder:', err);
      throw err;
    }
  }
  
  // Create database file
  dbInstance = await open({
    filename: path.join(dbDir, 'core.db'),  // database/core.db
    driver: sqlite3.Database
  });

  // Create items table
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      link TEXT UNIQUE NOT NULL,
      pubDate TEXT NOT NULL,
      size TEXT,
      category TEXT,
      categoryId TEXT,
      seeders INTEGER,
      leechers INTEGER,
      downloads INTEGER,
      infoHash TEXT,
      comments INTEGER,
      trusted INTEGER,
      remake INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  return dbInstance;
}
