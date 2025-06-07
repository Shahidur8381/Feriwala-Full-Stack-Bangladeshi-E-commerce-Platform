const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'ecommerce.db');

console.log('Updating orders table status constraint...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database for status constraint update');
});

async function updateStatusConstraint() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First, create a new table with the updated constraint
      db.run(`
        CREATE TABLE orders_new (
          orderId TEXT PRIMARY KEY,
          customerName TEXT NOT NULL,
          customerPhone TEXT NOT NULL,
          customerAddress TEXT NOT NULL,
          customerEmail TEXT NOT NULL,
          deliveryLocation TEXT DEFAULT 'inside_dhaka',
          deliveryCharge REAL DEFAULT 60,
          total REAL NOT NULL,
          status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'pending', 'paid', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          paymentMethod TEXT,
          paymentAccount TEXT,
          transactionId TEXT,
          paymentStatus TEXT DEFAULT 'pending'
        )
      `, (err) => {
        if (err) {
          console.error('Error creating new table:', err.message);
          reject(err);
          return;
        }
        console.log('✓ Created new orders table with updated constraint');

        // Copy data from old table to new table
        db.run(`
          INSERT INTO orders_new 
          SELECT * FROM orders
        `, (err) => {
          if (err) {
            console.error('Error copying data:', err.message);
            reject(err);
            return;
          }
          console.log('✓ Copied all data to new table');

          // Drop the old table
          db.run(`DROP TABLE orders`, (err) => {
            if (err) {
              console.error('Error dropping old table:', err.message);
              reject(err);
              return;
            }
            console.log('✓ Dropped old orders table');

            // Rename new table to orders
            db.run(`ALTER TABLE orders_new RENAME TO orders`, (err) => {
              if (err) {
                console.error('Error renaming table:', err.message);
                reject(err);
                return;
              }
              console.log('✓ Renamed new table to orders');
              resolve();
            });
          });
        });
      });
    });
  });
}

updateStatusConstraint()
  .then(() => {
    console.log('✓ Status constraint update completed successfully!');
    
    // Verify the update
    db.all(`PRAGMA table_info(orders)`, (err, columns) => {
      if (err) {
        console.error('Error getting table info:', err.message);
      } else {
        console.log('\nUpdated table structure:');
        columns.forEach(col => {
          console.log(`  ${col.name}: ${col.type} ${col.dflt_value ? '(default: ' + col.dflt_value + ')' : ''}`);
        });
      }
      
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed.');
        }
      });
    });
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
  });
