import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./ecommerce.db');

// Check products schema
db.all("PRAGMA table_info(products)", (err, schema) => {
  if (err) {
    console.error('Error getting products schema:', err);
  } else {
    console.log('Products table schema:', schema);
  }
  
  db.all(`
    SELECT o.orderId as order_id, o.customerEmail, oi.id as item_id, oi.productId, p.title as product_name 
    FROM orders o 
    JOIN order_items oi ON o.orderId = oi.orderId 
    JOIN products p ON oi.productId = p.id 
    WHERE o.status = 'confirmed' 
    LIMIT 5
  `, (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Sample confirmed orders with items:');
      console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
  });
});
