import express from 'express';
import verifySellerJWT from '../middleware/verifySellerJWT.js';

const createAdminRoutes = (db) => {
  const router = express.Router();

  // Apply JWT middleware to all admin routes
  router.use(verifySellerJWT);
  // Get all orders (admin only)
  router.get('/orders', (req, res) => {
    db.all(`
      SELECT o.*, 
             GROUP_CONCAT(oi.title || ' (x' || oi.quantity || ')') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.orderId = oi.orderId
      GROUP BY o.orderId
      ORDER BY o.createdAt DESC
    `, (err, orders) => {
      if (err) {
        console.error('Error fetching orders:', err.message);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }
      res.json(orders);
    });
  });
  // Update order status (admin only)
  router.patch('/orders/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['unpaid', 'pending', 'paid', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
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

  // Get all customers
  router.get('/customers', (req, res) => {
    db.all(`
      SELECT c.*, COUNT(o.orderId) as totalOrders
      FROM customers c
      LEFT JOIN orders o ON c.email = o.customerEmail
      GROUP BY c.id
      ORDER BY c.createdAt DESC
    `, (err, customers) => {
      if (err) {
        console.error('Error fetching customers:', err.message);
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
      res.json(customers);
    });
  });

  // Get all reviews
  router.get('/reviews', (req, res) => {
    db.all(`
      SELECT r.*, p.title as productTitle, o.customerName
      FROM reviews r
      JOIN products p ON r.productId = p.id
      JOIN orders o ON r.orderId = o.orderId
      ORDER BY r.createdAt DESC
    `, (err, reviews) => {
      if (err) {
        console.error('Error fetching reviews:', err.message);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
      }
      res.json(reviews);
    });
  });

  return router;
};

export default createAdminRoutes;
