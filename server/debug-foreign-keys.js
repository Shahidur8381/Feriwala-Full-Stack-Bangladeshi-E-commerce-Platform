import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('./ecommerce.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database schema and data...\n');

// Check if product with ID 1 exists
db.get('SELECT id, title, price, stock FROM products WHERE id = ?', [1], (err, product) => {
  if (err) {
    console.error('Error checking product:', err);
  } else if (product) {
    console.log('✅ Product 1 exists:', product);
  } else {
    console.log('❌ Product 1 does not exist in database');
  }
  
  // Check foreign key constraints
  db.all("PRAGMA foreign_key_list(order_items)", (err, foreignKeys) => {
    if (err) {
      console.error('Error checking foreign keys:', err);
    } else {
      console.log('\nForeign key constraints on order_items:', foreignKeys);
    }
    
    // Check table schemas
    db.all("PRAGMA table_info(products)", (err, productsSchema) => {
      if (err) {
        console.error('Error checking products schema:', err);
      } else {
        console.log('\nProducts table schema:', productsSchema);
      }
      
      db.all("PRAGMA table_info(order_items)", (err, orderItemsSchema) => {
        if (err) {
          console.error('Error checking order_items schema:', err);
        } else {
          console.log('\nOrder_items table schema:', orderItemsSchema);
        }
        
        // Check if foreign keys are enabled
        db.get("PRAGMA foreign_keys", (err, result) => {
          if (err) {
            console.error('Error checking foreign key setting:', err);
          } else {
            console.log('\nForeign keys enabled:', result);
          }
          
          db.close();
        });
      });
    });
  });
});
