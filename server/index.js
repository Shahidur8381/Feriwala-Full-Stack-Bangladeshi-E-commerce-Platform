// server/index.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';

import createSellerRoutes from './routes/sellerRoutes.js';
import createProductRoutes from './routes/productRoutes.js';
import createOrderRoutes from './routes/orderRoutes.js';
import createReviewRoutes from './routes/reviewRoutes.js';
import createAdminRoutes from './routes/adminRoutes.js';
import sellerAdminTokenRoutes from './routes/sellerAdminTokenRoutes.js';
import verifySellerJWT from './middleware/verifySellerJWT.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set in .env. Using a default or expecting fallback in route modules.');
}

// Setup file uploads
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true }); // Added { recursive: true } for robustness
  console.log(`Uploads directory created at ${uploadPath}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadPath));

// Initialize SQLite DB
const db = new sqlite3.Database('./ecommerce.db', (err) => {
  if (err) {
    console.error('DB connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // Enable foreign key constraints after connection is established
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        console.error('Failed to enable foreign keys:', pragmaErr.message);
      } else {
        console.log('Foreign keys enabled for SQLite.');
      }
    });
  }
});

// Create sellers table first (required for foreign key in products table)
db.serialize(() => { // Use db.serialize to ensure sequential execution for table creation
  db.run(`
    CREATE TABLE IF NOT EXISTS sellers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      shopName TEXT NOT NULL,
      shopDetails TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating sellers table:', err.message);
    } else {
      console.log('Sellers table checked/created successfully.');
    }
  });

  // Create products table with seller_id and foreign key constraint
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
      deliverycharge_inside REAL DEFAULT 0,
      deliverycharge_outside REAL DEFAULT 0,
      sold TEXT DEFAULT 0,        -- Consider JSON type or separate table for structured data
      rating TEXT DEFAULT 0.0,      -- Consider JSON type or separate table
      total_rating TEXT DEFAULT 0,-- Consider JSON type or separate table
      reviews TEXT DEFAULT 'No reviews',     -- Consider JSON type or separate table
      shopname TEXT DEFAULT '{}',    -- This might be redundant if linked to seller via seller_id
      shopdetails TEXT DEFAULT '{}', -- This might be redundant if linked to seller via seller_id
      tags TEXT DEFAULT '',
      image TEXT,
      seller_id INTEGER NOT NULL,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating products table:', err.message);
    } else {      console.log('Products table checked/created successfully.');
    }
  });

  // Create seller admin token store table
  db.run(`
    CREATE TABLE IF NOT EXISTS seller_admin_token_store (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    )
  `, (err) => {
    if (err) {
      console.error('Error creating seller_admin_token_store table:', err.message);
    } else {
      console.log('Seller admin token store table checked/created successfully.');
    }
  });
});

// --- Route Mounting ---
// Mounts seller routes. With the updated sellerRoutes.js having GET '/', 
// this makes GET /api/sellers (to fetch all sellers) available.
app.use('/api/sellers', createSellerRoutes(db, process.env.JWT_SECRET || 'your_fallback_secret_key')); 
app.use('/api/products', createProductRoutes(db, upload));
app.use('/api/orders', createOrderRoutes(db));
app.use('/api/reviews', createReviewRoutes(db));
app.use('/api/admin', createAdminRoutes(db)); // Admin routes

// Seller admin token routes (middleware to attach db)
app.use('/api/seller-admin', (req, res, next) => {
  req.db = db;
  next();
}, sellerAdminTokenRoutes);

// Test protected route (ensure verifySellerJWT is correctly implemented)
app.get('/api/test-protected', verifySellerJWT, (req, res) => {
  res.json({ 
    message: 'You accessed a protected route',
    seller: req.seller // req.seller should be populated by verifySellerJWT middleware
  });
});

// Simple root route to indicate the backend is running
app.get('/', (req, res) => {
  res.send('Backend for E-commerce API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (process.env.JWT_SECRET) {
    console.log('JWT Secret: Using secret from .env file.');
  } else {
    console.warn('JWT Secret: Not found in .env. Using fallback or default secret from route modules.');
  }
});