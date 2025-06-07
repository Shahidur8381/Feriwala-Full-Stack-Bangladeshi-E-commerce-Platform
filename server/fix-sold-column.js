import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath);

console.log('Fixing sold column type from TEXT to INTEGER...');

db.serialize(() => {
  // First, let's check the current sold values
  db.all('SELECT id, title, sold FROM products', (err, rows) => {
    if (err) {
      console.error('Error reading products:', err.message);
      return;
    }

    console.log('Current sold values (as TEXT):');
    rows.slice(0, 5).forEach(row => {
      console.log(`ID ${row.id}: sold = "${row.sold}" (type: ${typeof row.sold})`);
    });

    // Create a temporary table with correct INTEGER type for sold
    db.run(`
      CREATE TABLE products_temp AS 
      SELECT 
        id, title, description, price, discount, discount_validity, final_price, 
        category, brand, stock, deliverycharge_inside, deliverycharge_outside,
        CAST(COALESCE(sold, 0) AS INTEGER) as sold,
        rating, total_rating, reviews, shopname, shopdetails, tags, image, seller_id
      FROM products
    `, (err) => {
      if (err) {
        console.error('Error creating temp table:', err.message);
        return;
      }

      // Drop the original table
      db.run('DROP TABLE products', (err) => {
        if (err) {
          console.error('Error dropping original table:', err.message);
          return;
        }

        // Rename temp table to products
        db.run('ALTER TABLE products_temp RENAME TO products', (err) => {
          if (err) {
            console.error('Error renaming table:', err.message);
            return;
          }

          console.log('✅ Successfully converted sold column to INTEGER type');

          // Verify the change
          db.all('SELECT id, title, sold FROM products LIMIT 5', (err, newRows) => {
            if (err) {
              console.error('Error verifying results:', err.message);
              return;
            }

            console.log('\nVerification - sold values (as INTEGER):');
            newRows.forEach(row => {
              console.log(`ID ${row.id}: sold = ${row.sold} (type: ${typeof row.sold})`);
            });

            // Check the new schema
            db.all("PRAGMA table_info(products)", (err, info) => {
              if (err) {
                console.error('Error getting schema:', err.message);
              } else {
                const soldColumn = info.find(col => col.name === 'sold');
                console.log(`\n✅ Sold column type is now: ${soldColumn.type}`);
              }
              db.close();
            });
          });
        });
      });
    });
  });
});
