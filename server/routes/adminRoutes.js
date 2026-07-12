import express from 'express';
import verifySellerJWT from '../middleware/verifySellerJWT.js';

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

const createAdminRoutes = (db) => {
  const router = express.Router();
  const pool = db.pool;

  // Apply JWT middleware to all admin routes
  router.use(verifySellerJWT);

  // Get all orders for the specific seller
  router.get('/orders', async (req, res) => {
    try {
      const sellerId = req.seller.id;
      if (!sellerId) return res.status(403).json({ error: 'Seller profile required' });

      const { rows } = await pool.query(`
        SELECT o.*,
               STRING_AGG(oi.title || ' (x' || oi.quantity || ')', ', ') as items
        FROM orders o
        JOIN order_items oi ON o.orderid = oi.orderid
        JOIN products p ON oi.productid = p.id
        WHERE p.seller_id = $1
        GROUP BY o.orderid
        ORDER BY o.createdat DESC
      `, [sellerId]);
      res.json(rows.map(row => ({ ...normalizeOrder(row), items: row.items ?? null })));
    } catch (err) {
      console.error('Error fetching orders:', err.message);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Update order status (seller only if they own items in it)
  router.patch('/orders/:orderId/status', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.seller.id;

    if (!sellerId) return res.status(403).json({ error: 'Seller profile required' });
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const validStatuses = ['unpaid', 'pending', 'paid', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    try {
      // Verify order belongs to this seller
      const { rows: verifyRows } = await pool.query(`
        SELECT 1 FROM order_items oi
        JOIN products p ON oi.productid = p.id
        WHERE oi.orderid = $1 AND p.seller_id = $2
        LIMIT 1
      `, [orderId, sellerId]);

      if (verifyRows.length === 0) {
        return res.status(403).json({ error: 'You do not have permission to update this order' });
      }

      const { rowCount } = await pool.query(
        'UPDATE orders SET status = $1 WHERE orderid = $2',
        [status, orderId]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Order not found' });
      res.json({ message: 'Order status updated successfully' });
    } catch (err) {
      console.error('Error updating order status:', err.message);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Get all customers
  router.get('/customers', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT c.*, COUNT(o.orderid) as totalorders
        FROM customers c
        LEFT JOIN orders o ON c.email = o.customeremail
        GROUP BY c.id
        ORDER BY c.createdat DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error('Error fetching customers:', err.message);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  // Get all reviews
  router.get('/reviews', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT r.*, p.title as producttitle, o.customername
        FROM reviews r
        JOIN products p ON r.productid = p.id
        JOIN orders o ON r.orderid = o.orderid
        ORDER BY r.createdat DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error('Error fetching reviews:', err.message);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  return router;
};

export default createAdminRoutes;
