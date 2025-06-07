import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const createOrderRoutes = (db) => {
  const router = express.Router();

  // Create orders table
  db.serialize(() => {    // Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        orderId TEXT PRIMARY KEY,
        customerName TEXT NOT NULL,
        customerPhone TEXT NOT NULL,
        customerAddress TEXT NOT NULL,
        customerEmail TEXT NOT NULL,
        deliveryLocation TEXT DEFAULT 'inside_dhaka',
        deliveryCharge REAL DEFAULT 60,
        total REAL NOT NULL,
        status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'pending', 'paid', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating orders table:', err.message);
      } else {
        console.log('Orders table checked/created successfully.');
        
        // Add new columns if they don't exist (for existing databases)
        db.run(`ALTER TABLE orders ADD COLUMN deliveryLocation TEXT DEFAULT 'inside_dhaka'`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column name')) {
            console.error('Error adding deliveryLocation column:', alterErr.message);
          }
        });
        
        db.run(`ALTER TABLE orders ADD COLUMN deliveryCharge REAL DEFAULT 60`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column name')) {
            console.error('Error adding deliveryCharge column:', alterErr.message);
          }
        });
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
    const { customerName, customerPhone, customerAddress, customerEmail, deliveryLocation, deliveryCharge, items, total } = req.body;

    if (!customerName || !customerPhone || !customerAddress || !customerEmail || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Set default values for delivery fields if not provided
    const finalDeliveryLocation = deliveryLocation || 'inside_dhaka';
    const finalDeliveryCharge = deliveryCharge || (finalDeliveryLocation === 'inside_dhaka' ? 60 : 120);

    const orderId = uuidv4();

    // First, validate stock availability for all items
    const stockCheckPromises = items.map(item => {
      return new Promise((resolve, reject) => {
        db.get(`
          SELECT id, title, stock FROM products WHERE id = ?
        `, [item.id], (err, product) => {
          if (err) {
            reject(new Error(`Error checking stock for product ${item.id}: ${err.message}`));
          } else if (!product) {
            reject(new Error(`Product ${item.id} not found`));
          } else if (product.stock < item.quantity) {
            reject(new Error(`Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}`));
          } else {
            resolve(product);
          }
        });
      });
    });

    Promise.all(stockCheckPromises)
      .then(() => {
        // All stock checks passed, proceed with order creation
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
          });          // Insert order
          db.run(`
            INSERT INTO orders (orderId, customerName, customerPhone, customerAddress, customerEmail, deliveryLocation, deliveryCharge, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')
          `, [orderId, customerName, customerPhone, customerAddress, customerEmail, finalDeliveryLocation, finalDeliveryCharge, total], function(err) {
            if (err) {
              console.error('Error inserting order:', err.message);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to create order' });
            }

            // Insert order items and update stock
            const insertItem = db.prepare(`
              INSERT INTO order_items (orderId, productId, title, price, quantity, image)
              VALUES (?, ?, ?, ?, ?, ?)
            `);            let itemsProcessed = 0;
            let hasError = false;

            items.forEach(item => {
              insertItem.run([orderId, item.id, item.title, item.price, item.quantity, item.image], function(err) {
                if (err && !hasError) {
                  console.error('Error inserting order item:', err.message);
                  hasError = true;
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to create order items' });
                }                // Update product sold count and decrease stock
                db.run(`
                  UPDATE products 
                  SET sold = CAST(COALESCE(sold, 0) AS INTEGER) + ?, 
                      stock = CAST(COALESCE(stock, 0) AS INTEGER) - ?
                  WHERE id = ?
                `, [item.quantity, item.quantity, item.id], function(updateErr) {
                  if (updateErr) {
                    console.error('Error updating product inventory:', updateErr.message);
                    if (!hasError) {
                      hasError = true;
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: 'Failed to update product inventory' });
                    }
                  }                  // Only increment and check for completion after BOTH operations are done
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
            });

            insertItem.finalize();
          });
        });
      })
      .catch(error => {
        console.error('Stock validation failed:', error.message);
        res.status(400).json({ error: error.message });
      });
  });

  // Process payment for an order
  router.post('/:orderId/payment', (req, res) => {
    const { orderId } = req.params;
    const { paymentMethod, paymentAccount, transactionId } = req.body;

    // Validate required fields
    if (!paymentMethod || !paymentAccount || !transactionId) {
      return res.status(400).json({ 
        error: 'All payment fields are required',
        required: ['paymentMethod', 'paymentAccount', 'transactionId']
      });
    }

    // Validate payment method
    const validPaymentMethods = ['bkash', 'nagad', 'rocket', 'upay', 'visa', 'mastercard'];
    if (!validPaymentMethods.includes(paymentMethod.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid payment method',
        validMethods: validPaymentMethods
      });
    }

    // First check if order exists and is unpaid
    db.get(`SELECT * FROM orders WHERE orderId = ?`, [orderId], (err, order) => {
      if (err) {
        console.error('Error checking order:', err.message);
        return res.status(500).json({ error: 'Failed to check order' });
      }

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'unpaid') {
        return res.status(400).json({ 
          error: 'Order is not eligible for payment',
          currentStatus: order.status
        });
      }

      // Update order with payment information and set status to pending
      db.run(`
        UPDATE orders 
        SET paymentMethod = ?, paymentAccount = ?, transactionId = ?, status = 'pending', paymentStatus = 'pending'
        WHERE orderId = ?
      `, [paymentMethod.toLowerCase(), paymentAccount, transactionId, orderId], function(err) {
        if (err) {
          console.error('Error processing payment:', err.message);
          return res.status(500).json({ error: 'Failed to process payment' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ 
          message: 'Payment information submitted successfully',
          orderId: orderId,
          status: 'pending',
          paymentMethod: paymentMethod.toLowerCase(),
          transactionId: transactionId
        });
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

  // Get orders by user email
  router.get('/user/:email', (req, res) => {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    db.all(`
      SELECT o.*, 
             JSON_GROUP_ARRAY(
               JSON_OBJECT(
                 'id', oi.productId,
                 'title', oi.title,
                 'price', oi.price,
                 'quantity', oi.quantity,
                 'image', oi.image
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.orderId = oi.orderId
      WHERE o.customerEmail = ?
      GROUP BY o.orderId
      ORDER BY o.createdAt DESC
    `, [email], (err, rows) => {
      if (err) {
        console.error('Error fetching user orders:', err.message);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }

      // Parse the JSON items for each order
      const orders = rows.map(order => ({
        ...order,
        items: JSON.parse(order.items || '[]')
      }));

      res.json(orders);
    });
  });
    // Get all valid order statuses
  router.get('/statuses/all', (req, res) => {
    const statuses = [
      { value: 'unpaid', label: 'Unpaid', description: 'Order placed but payment not received' },
      { value: 'pending', label: 'Payment Pending', description: 'Payment information submitted, awaiting verification' },
      { value: 'paid', label: 'Paid', description: 'Payment received, order confirmed' },
      { value: 'ready_to_ship', label: 'Ready to Ship', description: 'Order packed and ready for shipping' },
      { value: 'shipped', label: 'Shipped', description: 'Order has been shipped' },
      { value: 'out_for_delivery', label: 'Out for Delivery', description: 'Order is out for delivery' },
      { value: 'delivered', label: 'Delivered', description: 'Order has been delivered' }
    ];
    
    res.json(statuses);
  });

  // Update order status
  router.patch('/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;    // Validate status value
    const validStatuses = ['unpaid', 'pending', 'paid', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value', 
        validStatuses: validStatuses 
      });
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

      res.json({ 
        message: 'Order status updated successfully',
        orderId: orderId,
        newStatus: status
      });    });
  });

  // Get order items by order ID
  router.get('/:orderId/items', (req, res) => {
    const { orderId } = req.params;

    db.all(`
      SELECT 
        id,
        productId,
        title,
        price,
        quantity,
        image
      FROM order_items 
      WHERE orderId = ?
    `, [orderId], (err, items) => {
      if (err) {
        console.error('Error fetching order items:', err.message);
        return res.status(500).json({ error: 'Failed to fetch order items' });
      }

      res.json(items);
    });
  });

  return router;
};

export default createOrderRoutes;
