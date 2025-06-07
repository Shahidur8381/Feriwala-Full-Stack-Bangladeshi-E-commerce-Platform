import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('./ecommerce.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking and fixing products table schema...\n');

// First, let's see the current CREATE TABLE statement for products
db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='products'", (err, result) => {
  if (err) {
    console.error('Error getting table schema:', err);
    db.close();
    return;
  }
  
  console.log('Current products table schema:');
  console.log(result.sql);
  console.log('\n');
  
  // Check if id is actually used as primary key in practice
  db.get("SELECT MIN(id), MAX(id), COUNT(*), COUNT(DISTINCT id) FROM products", (err, stats) => {
    if (err) {
      console.error('Error checking product id stats:', err);
    } else {
      console.log('Product ID statistics:', stats);
      console.log('IDs are unique:', stats['COUNT(*)'] === stats['COUNT(DISTINCT id)']);
    }
    
    // The fix: We need to recreate the products table with id as PRIMARY KEY
    // But first, let's backup the data and recreate the table properly
    
    console.log('\n🔧 Starting products table fix...');
    
    db.serialize(() => {
      // Step 1: Create a backup table
      db.run(`CREATE TEMPORARY TABLE products_backup AS SELECT * FROM products`, (err) => {
        if (err) {
          console.error('❌ Error creating backup:', err);
          db.close();
          return;
        }
        console.log('✅ Created backup table');
        
        // Step 2: Drop the original table
        db.run(`DROP TABLE products`, (err) => {
          if (err) {
            console.error('❌ Error dropping original table:', err);
            db.close();
            return;
          }
          console.log('✅ Dropped original products table');
          
          // Step 3: Recreate with proper schema
          db.run(`
            CREATE TABLE products (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT,
              description TEXT,
              price REAL,
              discount REAL,
              discount_validity TEXT,
              final_price REAL,
              category TEXT,
              brand TEXT,
              stock INT,
              deliverycharge_inside REAL,
              deliverycharge_outside REAL,
              sold INT DEFAULT 0,
              rating TEXT,
              total_rating TEXT,
              reviews TEXT,
              shopname TEXT,
              shopdetails TEXT,
              tags TEXT,
              image TEXT,
              seller_id INT
            )
          `, (err) => {
            if (err) {
              console.error('❌ Error creating new table:', err);
              db.close();
              return;
            }
            console.log('✅ Created new products table with proper PRIMARY KEY');
            
            // Step 4: Restore data
            db.run(`
              INSERT INTO products 
              SELECT * FROM products_backup
            `, (err) => {
              if (err) {
                console.error('❌ Error restoring data:', err);
                db.close();
                return;
              }
              console.log('✅ Restored all product data');
              
              // Step 5: Verify the fix
              db.all("PRAGMA table_info(products)", (err, schema) => {
                if (err) {
                  console.error('Error checking new schema:', err);
                } else {
                  console.log('\\n✅ New products table schema:');
                  const idColumn = schema.find(col => col.name === 'id');
                  console.log('ID column:', idColumn);
                  console.log('Is Primary Key:', idColumn.pk === 1 ? 'YES' : 'NO');
                }
                
                db.close();
                console.log('\\n🎉 Products table fix completed!');
                console.log('You can now test order placement again.');
              });
            });
          });
        });
      });
    });
  });
});
