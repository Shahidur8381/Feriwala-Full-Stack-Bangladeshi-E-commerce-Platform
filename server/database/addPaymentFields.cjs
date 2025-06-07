const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Migration script to add payment fields to orders table
function addPaymentFields() {
  const dbPath = path.join(__dirname, '../ecommerce.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err.message);
    } else {
      console.log('Connected to SQLite database for payment fields migration');
    }
  });

  db.serialize(() => {
    console.log('Adding payment fields to orders table...');

    // Add payment method column
    db.run(`ALTER TABLE orders ADD COLUMN paymentMethod TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding paymentMethod column:', err.message);
      } else {
        console.log('✓ Added paymentMethod column');
      }
    });

    // Add mobile/account number column
    db.run(`ALTER TABLE orders ADD COLUMN paymentAccount TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding paymentAccount column:', err.message);
      } else {
        console.log('✓ Added paymentAccount column');
      }
    });

    // Add transaction ID column
    db.run(`ALTER TABLE orders ADD COLUMN transactionId TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding transactionId column:', err.message);
      } else {
        console.log('✓ Added transactionId column');
      }
    });

    // Add payment status column (for tracking payment verification)
    db.run(`ALTER TABLE orders ADD COLUMN paymentStatus TEXT DEFAULT 'pending'`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding paymentStatus column:', err.message);
      } else {
        console.log('✓ Added paymentStatus column');
      }
    });

    // Update the status enum to include 'pending'
    console.log('✓ Payment fields migration completed!');
    
    // Verify the changes
    db.all("PRAGMA table_info(orders)", (err, structure) => {
      if (err) {
        console.error('Error checking table structure:', err.message);
      } else {
        console.log('Updated table structure:');
        structure.forEach(col => {
          console.log(`  ${col.name}: ${col.type} ${col.dflt_value ? `(default: ${col.dflt_value})` : ''}`);
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
  });

  return db;
}

// Run the migration
console.log('Running payment fields migration...');
addPaymentFields();
