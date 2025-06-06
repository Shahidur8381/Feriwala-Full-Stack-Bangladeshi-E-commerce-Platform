import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const createOrderRoutes = (db) => {
  const router = express.Router();

  // Create orders table
  db.serialize(() => {
    // Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        orderId TEXT PRIMARY KEY,
        customerName TEXT NOT NULL,
        customerPhone TEXT NOT NULL,
        customerAddress TEXT NOT NULL,
        customerEmail TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'confirmed',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating orders table:', err.message);
      } else {
        console.log('Orders table checked/created successfully.');
      }
    });

    // Order items table
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId TEXT NOT NULL,
        productId INTEGER NOT NULL,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        image TEXT,
        FOREIGN KEY (orderId) REFERENCES orders(orderId) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating order_items table:', err.message);
      } else {
        console.log('Order_items table checked/created successfully.');
      }
    });

    // Reviews table
    db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        orderId TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (orderId) REFERENCES orders(orderId) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating reviews table:', err.message);
      } else {
        console.log('Reviews table checked/created successfully.');
      }
    });

    // Customers table for storing customer details
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating customers table:', err.message);
      } else {
        console.log('Customers table checked/created successfully.');
      }
    });
  });

  // Place a new order
  router.post('/', (req, res) => {
    const { customerName, customerPhone, customerAddress, customerEmail, items, total } = req.body;

    if (!customerName || !customerPhone || !customerAddress || !customerEmail || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = uuidv4();

    db.serialize(() => {
      // Start transaction
      db.run('BEGIN TRANSACTION');

      // Insert or update customer
      db.run(`
        INSERT OR REPLACE INTO customers (email, name, phone, address)
        VALUES (?, ?, ?, ?)
      `, [customerEmail, customerName, customerPhone, customerAddress], function(err) {
        if (err) {
          console.error('Error inserting customer:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to save customer data' });
        }
      });

      // Insert order
      db.run(`
        INSERT INTO orders (orderId, customerName, customerPhone, customerAddress, customerEmail, total, status)
        VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
      `, [orderId, customerName, customerPhone, customerAddress, customerEmail, total], function(err) {
        if (err) {
          console.error('Error inserting order:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to create order' });
        }

        // Insert order items
        const insertItem = db.prepare(`
          INSERT INTO order_items (orderId, productId, title, price, quantity, image)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        let itemsProcessed = 0;
        let hasError = false;        items.forEach(item => {
          insertItem.run([orderId, item.id, item.title, item.price, item.quantity, item.image], function(err) {
            if (err && !hasError) {
              console.error('Error inserting order item:', err.message);
              hasError = true;
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to create order items' });
            }

            // Update product sold count
            db.run(`
              UPDATE products 
              SET sold = CAST(sold AS INTEGER) + ? 
              WHERE id = ?
            `, [item.quantity, item.id], (updateErr) => {
              if (updateErr) {
                console.error('Error updating sold count:', updateErr.message);
              }
            });

            itemsProcessed++;
            if (itemsProcessed === items.length && !hasError) {
              // Commit transaction
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error('Error committing transaction:', commitErr.message);
                  return res.status(500).json({ error: 'Failed to complete order' });
                }
                res.status(201).json({ orderId, message: 'Order placed successfully' });
              });
            }
          });
        });

        insertItem.finalize();
      });
    });
  });

  // Get order by ID
  router.get('/:orderId', (req, res) => {
    const { orderId } = req.params;

    db.get(`
      SELECT * FROM orders WHERE orderId = ?
    `, [orderId], (err, order) => {
      if (err) {
        console.error('Error fetching order:', err.message);
        return res.status(500).json({ error: 'Failed to fetch order' });
      }

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Get order items
      db.all(`
        SELECT * FROM order_items WHERE orderId = ?
      `, [orderId], (err, items) => {
        if (err) {
          console.error('Error fetching order items:', err.message);
          return res.status(500).json({ error: 'Failed to fetch order items' });
        }

        res.json({
          ...order,
          items
        });
      });
    });
  });

  // Get orders by customer email
  router.get('/customer/:email', (req, res) => {
    const { email } = req.params;

    db.all(`
      SELECT * FROM orders WHERE customerEmail = ? ORDER BY createdAt DESC
    `, [email], (err, orders) => {
      if (err) {
        console.error('Error fetching customer orders:', err.message);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }

      res.json(orders);
    });
  });

  // Update order status
  router.patch('/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    db.run(`
      UPDATE orders SET status = ? WHERE orderId = ?
    `, [status, orderId], function(err) {
      if (err) {
        console.error('Error updating order status:', err.message);
        return res.status(500).json({ error: 'Failed to update order status' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ message: 'Order status updated successfully' });
    });
  });

  return router;
};

export default createOrderRoutes;
