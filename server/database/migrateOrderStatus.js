import sqlite3 from 'sqlite3';
import { logger } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database migration to update order status system
export default function updateOrderStatusSchema() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../ecommerce.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      logger.error('Database connection error:', err.message);
    } else {
      logger.info('Connected to SQLite database for order status migration');
    }
  });

  db.serialize(() => {
    // First, let's check current status values
    db.all("SELECT DISTINCT status FROM orders", (err, rows) => {
      if (err) {
        console.error('Error checking current status values:', err.message);
      } else {
        console.log('Current status values in database:', rows);
      }
    });

    // Update the orders table to change default status to 'unpaid'
    // Since SQLite doesn't support ALTER COLUMN directly, we need to:
    // 1. Create a backup of existing data
    // 2. Drop and recreate the table with new schema
    // 3. Restore the data with updated status values

    console.log('Starting order status migration...');

    // Step 1: Create a backup table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders_backup AS 
      SELECT * FROM orders
    `, (err) => {
      if (err) {
        console.error('Error creating backup table:', err.message);
        return;
      }
      console.log('✓ Created backup table');

      // Step 2: Drop the original table
      db.run(`DROP TABLE orders`, (err) => {
        if (err) {
          console.error('Error dropping original table:', err.message);
          return;
        }
        console.log('✓ Dropped original orders table');

        // Step 3: Create new orders table with updated schema
        db.run(`
          CREATE TABLE orders (
            orderId TEXT PRIMARY KEY,
            customerName TEXT NOT NULL,
            customerPhone TEXT NOT NULL,
            customerAddress TEXT NOT NULL,
            customerEmail TEXT NOT NULL,
            deliveryLocation TEXT DEFAULT 'inside_dhaka',
            deliveryCharge REAL DEFAULT 60,
            total REAL NOT NULL,
            status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered')),
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating new orders table:', err.message);
            return;
          }
          console.log('✓ Created new orders table with status constraints');

          // Step 4: Migrate data from backup with status mapping
          db.run(`
            INSERT INTO orders (orderId, customerName, customerPhone, customerAddress, customerEmail, deliveryLocation, deliveryCharge, total, status, createdAt)
            SELECT 
              orderId, 
              customerName, 
              customerPhone, 
              customerAddress, 
              customerEmail, 
              deliveryLocation, 
              deliveryCharge, 
              total,
              CASE 
                WHEN status = 'confirmed' THEN 'paid'
                WHEN status = 'delivered' THEN 'delivered'
                WHEN status = 'shipped' THEN 'shipped'
                ELSE 'unpaid'
              END as status,
              createdAt
            FROM orders_backup
          `, (err) => {
            if (err) {
              console.error('Error migrating data:', err.message);
              return;
            }
            console.log('✓ Migrated data with updated status values');

            // Step 5: Drop backup table
            db.run(`DROP TABLE orders_backup`, (err) => {
              if (err) {
                console.error('Error dropping backup table:', err.message);
              } else {
                console.log('✓ Cleaned up backup table');
              }

              // Verify the migration
              db.all("SELECT orderId, status, createdAt FROM orders ORDER BY createdAt DESC LIMIT 5", (err, rows) => {
                if (err) {
                  console.error('Error verifying migration:', err.message);
                } else {
                  console.log('✓ Migration completed successfully!');
                  console.log('Sample orders after migration:', rows);
                }
                
                db.close((err) => {
                  if (err) {
                    console.error('Error closing database:', err.message);
                  } else {
                    console.log('Database connection closed.');
                  }
                });
              });
            });
          });
        });
      });
    });
  });

  return db;
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running order status migration...');
  updateOrderStatusSchema();
}
