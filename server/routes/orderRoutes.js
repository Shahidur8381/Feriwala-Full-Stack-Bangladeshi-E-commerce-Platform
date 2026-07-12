import express from 'express';
import { v4 as uuidv4 } from 'uuid';

// Map PostgreSQL lowercase columns → camelCase for the frontend
function normalizeOrder(row) {
  if (!row) return null;
  return {
    orderId: row.orderid ?? row.orderId,
    customerName: row.customername ?? row.customerName,
    customerPhone: row.customerphone ?? row.customerPhone,
    customerAddress: row.customeraddress ?? row.customerAddress,
    customerEmail: row.customeremail ?? row.customerEmail,
    deliveryLocation: row.deliverylocation ?? row.deliveryLocation,
    deliveryCharge: row.deliverycharge ?? row.deliveryCharge,
    paymentMethod: row.paymentmethod ?? row.paymentMethod,
    paymentAccount: row.paymentaccount ?? row.paymentAccount,
    transactionId: row.transactionid ?? row.transactionId,
    paymentStatus: row.paymentstatus ?? row.paymentStatus,
    total: row.total,
    status: row.status,
    createdAt: row.createdat ?? row.createdAt,
    items: row.items ?? undefined,
  };
}

function normalizeItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.productid ?? row.productId,
    title: row.title,
    price: row.price,
    quantity: row.quantity,
    image: row.image,
  };
}

const createOrderRoutes = (db) => {
  const router = express.Router();
  const pool = db.pool; // direct pg.Pool access for transactions

  // Ensure tables and columns exist
  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          orderid TEXT PRIMARY KEY,
          customername TEXT NOT NULL,
          customerphone TEXT NOT NULL,
          customeraddress TEXT NOT NULL,
          customeremail TEXT NOT NULL,
          deliverylocation TEXT DEFAULT 'inside_dhaka',
          deliverycharge REAL DEFAULT 60,
          paymentmethod TEXT,
          paymentaccount TEXT,
          transactionid TEXT,
          paymentstatus TEXT DEFAULT 'pending',
          total REAL NOT NULL,
          status TEXT DEFAULT 'unpaid',
          createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Add missing columns if they don't exist
      const extraCols = [
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS paymentmethod TEXT`,
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS paymentaccount TEXT`,
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS transactionid TEXT`,
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS paymentstatus TEXT DEFAULT 'pending'`,
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliverylocation TEXT DEFAULT 'inside_dhaka'`,
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS deliverycharge REAL DEFAULT 60`,
      ];
      for (const sql of extraCols) {
        try { await pool.query(sql); } catch (_) {}
      }
      console.log('Orders table checked/created successfully.');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          orderid TEXT NOT NULL REFERENCES orders(orderid) ON DELETE CASCADE,
          productid INTEGER NOT NULL,
          title TEXT NOT NULL,
          price REAL NOT NULL,
          quantity INTEGER NOT NULL,
          image TEXT
        )
      `);
      console.log('Order_items table checked/created successfully.');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          productid INTEGER NOT NULL,
          orderid TEXT NOT NULL,
          customeremail TEXT,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT NOT NULL,
          createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customeremail TEXT`);
      console.log('Reviews table checked/created successfully.');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          auth_id UUID UNIQUE,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Customers table checked/created successfully.');
    } catch (err) {
      console.error('Error initializing order tables:', err.message);
    }
  })();

  // ─── POST / — Place a new order ───────────────────────────────────────────
  router.post('/', async (req, res) => {
    const { customerName, customerPhone, customerAddress, customerEmail, deliveryLocation, deliveryCharge, items, total } = req.body;

    if (!customerName || !customerPhone || !customerAddress || !customerEmail || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const finalDeliveryLocation = deliveryLocation || 'inside_dhaka';
    const finalDeliveryCharge = deliveryCharge ?? (finalDeliveryLocation === 'inside_dhaka' ? 60 : 120);
    const orderId = uuidv4();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check stock for all items
      for (const item of items) {
        const { rows } = await client.query(
          'SELECT id, title, stock FROM products WHERE id = $1',
          [item.id]
        );
        if (rows.length === 0) throw new Error(`Product ${item.id} not found`);
        if (Number(rows[0].stock) < item.quantity) {
          throw new Error(`Insufficient stock for ${rows[0].title}. Available: ${rows[0].stock}, Requested: ${item.quantity}`);
        }
      }

      // Upsert customer
      await client.query(`
        INSERT INTO customers (email, name, phone, address)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address
      `, [customerEmail, customerName, customerPhone, customerAddress]);

      // Insert order
      await client.query(`
        INSERT INTO orders (orderid, customername, customerphone, customeraddress, customeremail, deliverylocation, deliverycharge, total, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unpaid')
      `, [orderId, customerName, customerPhone, customerAddress, customerEmail, finalDeliveryLocation, finalDeliveryCharge, total]);

      // Insert items and update stock
      for (const item of items) {
        await client.query(`
          INSERT INTO order_items (orderid, productid, title, price, quantity, image)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [orderId, item.id, item.title, item.price, item.quantity, item.image]);

        await client.query(`
          UPDATE products
          SET sold = COALESCE(CAST(sold AS INTEGER), 0) + $1,
              stock = COALESCE(CAST(stock AS INTEGER), 0) - $2
          WHERE id = $3
        `, [item.quantity, item.quantity, item.id]);
      }

      await client.query('COMMIT');
      res.status(201).json({ orderId, message: 'Order placed successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Order creation failed:', err.message);
      res.status(err.message.includes('stock') || err.message.includes('not found') ? 400 : 500)
        .json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // ─── POST /:orderId/payment ───────────────────────────────────────────────
  router.post('/:orderId/payment', async (req, res) => {
    const { orderId } = req.params;
    const { paymentMethod, paymentAccount, transactionId } = req.body;

    if (!paymentMethod || !paymentAccount || !transactionId) {
      return res.status(400).json({
        error: 'All payment fields are required',
        required: ['paymentMethod', 'paymentAccount', 'transactionId']
      });
    }

    const validPaymentMethods = ['bkash', 'nagad', 'rocket', 'upay', 'visa', 'mastercard'];
    if (!validPaymentMethods.includes(paymentMethod.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid payment method', validMethods: validPaymentMethods });
    }

    try {
      const { rows } = await pool.query('SELECT * FROM orders WHERE orderid = $1', [orderId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
      if (rows[0].status !== 'unpaid') {
        return res.status(400).json({ error: 'Order is not eligible for payment', currentStatus: rows[0].status });
      }

      await pool.query(`
        UPDATE orders
        SET paymentmethod = $1, paymentaccount = $2, transactionid = $3, status = 'pending', paymentstatus = 'pending'
        WHERE orderid = $4
      `, [paymentMethod.toLowerCase(), paymentAccount, transactionId, orderId]);

      res.json({
        message: 'Payment information submitted successfully',
        orderId,
        status: 'pending',
        paymentMethod: paymentMethod.toLowerCase(),
        transactionId
      });
    } catch (err) {
      console.error('Payment error:', err.message);
      res.status(500).json({ error: 'Failed to process payment' });
    }
  });

  // ─── GET /statuses/all ────────────────────────────────────────────────────
  router.get('/statuses/all', (req, res) => {
    res.json([
      { value: 'unpaid', label: 'Unpaid', description: 'Order placed but payment not received' },
      { value: 'pending', label: 'Payment Pending', description: 'Payment information submitted, awaiting verification' },
      { value: 'paid', label: 'Paid', description: 'Payment received, order confirmed' },
      { value: 'ready_to_ship', label: 'Ready to Ship', description: 'Order packed and ready for shipping' },
      { value: 'shipped', label: 'Shipped', description: 'Order has been shipped' },
      { value: 'out_for_delivery', label: 'Out for Delivery', description: 'Order is out for delivery' },
      { value: 'delivered', label: 'Delivered', description: 'Order has been delivered' }
    ]);
  });

  // ─── GET /user/:email ─────────────────────────────────────────────────────
  router.get('/user/:email', async (req, res) => {
    const { email } = req.params;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
      const { rows } = await pool.query(`
        SELECT o.*,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', oi.productid,
                     'title', oi.title,
                     'price', oi.price,
                     'quantity', oi.quantity,
                     'image', oi.image
                   )
                 ) FILTER (WHERE oi.productid IS NOT NULL),
                 '[]'::json
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.orderid = oi.orderid
        WHERE o.customeremail = $1
        GROUP BY o.orderid
        ORDER BY o.createdat DESC
      `, [email]);

      res.json(rows.map(row => ({
        ...normalizeOrder(row),
        items: Array.isArray(row.items)
          ? row.items.map(item => ({
              id: item.id,
              productId: item.id, // json_build_object key is 'id'
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
            }))
          : []
      })));
    } catch (err) {
      console.error('Error fetching user orders:', err.message);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // ─── GET /customer/:email ─────────────────────────────────────────────────
  router.get('/customer/:email', async (req, res) => {
    const { email } = req.params;
    try {
      const { rows } = await pool.query(
        'SELECT * FROM orders WHERE customeremail = $1 ORDER BY createdat DESC',
        [email]
      );
      res.json(rows.map(normalizeOrder));
    } catch (err) {
      console.error('Error fetching customer orders:', err.message);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // ─── GET /:orderId/items ──────────────────────────────────────────────────
  router.get('/:orderId/items', async (req, res) => {
    const { orderId } = req.params;
    try {
      const { rows } = await pool.query(
        'SELECT id, productid, title, price, quantity, image FROM order_items WHERE orderid = $1',
        [orderId]
      );
      res.json(rows.map(normalizeItem));
    } catch (err) {
      console.error('Error fetching order items:', err.message);
      res.status(500).json({ error: 'Failed to fetch order items' });
    }
  });

  // ─── GET /:orderId ────────────────────────────────────────────────────────
  router.get('/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
      const { rows } = await pool.query('SELECT * FROM orders WHERE orderid = $1', [orderId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

      const { rows: items } = await pool.query(
        'SELECT * FROM order_items WHERE orderid = $1',
        [orderId]
      );
      res.json({ ...normalizeOrder(rows[0]), items: items.map(normalizeItem) });
    } catch (err) {
      console.error('Error fetching order:', err.message);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  // ─── PATCH /:orderId/status ───────────────────────────────────────────────
  router.patch('/:orderId/status', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const validStatuses = ['unpaid', 'pending', 'paid', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];

    if (!status) return res.status(400).json({ error: 'Status is required' });
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value', validStatuses });
    }

    try {
      const { rowCount } = await pool.query(
        'UPDATE orders SET status = $1 WHERE orderid = $2',
        [status, orderId]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Order not found' });
      res.json({ message: 'Order status updated successfully', orderId, newStatus: status });
    } catch (err) {
      console.error('Error updating order status:', err.message);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  return router;
};

export default createOrderRoutes;
