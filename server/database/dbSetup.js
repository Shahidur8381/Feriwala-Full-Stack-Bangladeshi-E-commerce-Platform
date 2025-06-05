import sqlite3 from 'sqlite3';
import { logger } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function dbSetup() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../ecommerce.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      logger.error('Database connection error:', err.message);
    } else {
      logger.info('Connected to SQLite database');
    }
  });

  // Create tables
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS sellers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        shopName TEXT NOT NULL,
        shopDetails TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        discount REAL DEFAULT 0,
        discount_validity TEXT,
        final_price REAL,
        category TEXT NOT NULL,
        brand TEXT DEFAULT 'none',
        stock INTEGER DEFAULT 0,
        delivery_charge REAL DEFAULT 0,
        sold INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        shop_id INTEGER NOT NULL,
        tags TEXT DEFAULT '',
        image TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES sellers(id)
      )
    `);
  });

  return db;
}