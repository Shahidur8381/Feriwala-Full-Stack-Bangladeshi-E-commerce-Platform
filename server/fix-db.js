import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking and fixing product sold values...');

// First, let's see the schema
db.all("PRAGMA table_info(products)", (err, info) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Products table schema:');
    console.table(info);
    
    // Fix the sold column data - convert string '{}' to integer 0
    db.run(`UPDATE products SET sold = 0 WHERE sold = '{}' OR sold IS NULL OR sold = ''`, function(err) {
      if (err) {
        console.error('Error updating sold values:', err.message);
      } else {
        console.log(`Updated ${this.changes} products with invalid sold values`);
        
        // Check results
        db.all('SELECT id, title, stock, sold FROM products LIMIT 10', (err, rows) => {
          if (err) {
            console.error('Error:', err.message);
          } else {
            console.log('\nUpdated Products:');
            console.table(rows);
          }
          db.close();
        });
      }
    });
  }
});
