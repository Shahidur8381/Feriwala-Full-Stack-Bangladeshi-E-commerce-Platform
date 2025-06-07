import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing the UPDATE query directly...\n');

// First check the product
db.get('SELECT id, title, stock, sold FROM products WHERE id = 1', (err, before) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  
  console.log('Product before update:', before);
  
  // Test the exact update query
  db.run(`
    UPDATE products 
    SET sold = CAST(COALESCE(sold, 0) AS INTEGER) + ?, 
        stock = CAST(COALESCE(stock, 0) AS INTEGER) - ?
    WHERE id = ?
  `, [1, 1, 1], function(updateErr) {
    if (updateErr) {
      console.error('Update error:', updateErr.message);
    } else {
      console.log('Update completed. Changes:', this.changes);
      
      // Check the product after update
      db.get('SELECT id, title, stock, sold FROM products WHERE id = 1', (err, after) => {
        if (err) {
          console.error('Error:', err.message);
        } else {
          console.log('Product after update:', after);
          console.log('Stock changed:', before.stock - after.stock);
          console.log('Sold changed:', after.sold - before.sold);
        }
        db.close();
      });
    }
  });
});
