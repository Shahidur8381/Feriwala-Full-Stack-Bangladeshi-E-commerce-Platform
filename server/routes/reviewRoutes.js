import express from 'express';

const createReviewRoutes = (db) => {
  const router = express.Router();
  const pool = db.pool;

  // Submit a review
  router.post('/', async (req, res) => {
    const { productId, orderId, rating, comment, customerEmail } = req.body;


    if (!productId || !orderId || !rating || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields (productId, orderId, rating, customerEmail)' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
      const { rows: orderRows } = await pool.query(
        `SELECT status, customeremail FROM orders WHERE orderid = $1`,
        [orderId]
      );
      if (orderRows.length === 0) return res.status(404).json({ error: 'Order not found' });
      const order = orderRows[0];

      if (order.customeremail !== customerEmail) {
        return res.status(403).json({ error: 'Unauthorized to review this order' });
      }
      if (order.status !== 'delivered') {
        return res.status(400).json({
          error: 'Reviews can only be submitted for delivered orders',
          currentStatus: order.status
        });
      }

      // Check if already reviewed
      const { rows: existingRows } = await pool.query(
        `SELECT r.id FROM reviews r
         JOIN orders o ON r.orderid = o.orderid
         WHERE r.productid = $1 AND o.customeremail = $2`,
        [productId, customerEmail]
      );
      if (existingRows.length > 0) {
        return res.status(400).json({ error: 'You have already reviewed this product' });
      }

      // Check product was in the order
      const { rows: itemRows } = await pool.query(
        `SELECT id FROM order_items WHERE orderid = $1 AND productid = $2`,
        [orderId, productId]
      );
      if (itemRows.length === 0) {
        return res.status(400).json({ error: 'Product not found in this order' });
      }

      // Insert review
      const { rows: inserted } = await pool.query(
        `INSERT INTO reviews (productid, orderid, customeremail, rating, comment)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [productId, orderId, customerEmail, rating, comment]
      );

      await updateProductRating(productId, pool);
      res.status(201).json({ id: inserted[0].id, message: 'Review submitted successfully' });
    } catch (err) {
      console.error('Error submitting review:', err.message);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  });

  // Update a review
  router.put('/:reviewId', async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment, customerEmail } = req.body;

    if (!rating || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields (rating, customerEmail)' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
      const { rows } = await pool.query(
        `SELECT r.*, o.customeremail
         FROM reviews r
         JOIN orders o ON r.orderid = o.orderid
         WHERE r.id = $1`,
        [reviewId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Review not found' });
      if (rows[0].customeremail !== customerEmail) {
        return res.status(403).json({ error: 'Unauthorized to update this review' });
      }

      await pool.query(
        `UPDATE reviews SET rating = $1, comment = $2, createdat = CURRENT_TIMESTAMP WHERE id = $3`,
        [rating, comment, reviewId]
      );

      await updateProductRating(rows[0].productid, pool);
      res.json({ message: 'Review updated successfully' });
    } catch (err) {
      console.error('Error updating review:', err.message);
      res.status(500).json({ error: 'Failed to update review' });
    }
  });

  // Get user's review for a specific product
  router.get('/user/:customerEmail/product/:productId', async (req, res) => {
    const { customerEmail, productId } = req.params;
    try {
      const { rows } = await pool.query(
        `SELECT r.*, o.customername
         FROM reviews r
         JOIN orders o ON r.orderid = o.orderid
         WHERE r.productid = $1 AND o.customeremail = $2`,
        [productId, customerEmail]
      );
      res.json(rows[0] || null);
    } catch (err) {
      console.error('Error fetching user review:', err.message);
      res.status(500).json({ error: 'Failed to fetch review' });
    }
  });

  // Check if user can review a product
  router.get('/can-review/:productId/:customerEmail', async (req, res) => {
    const { productId, customerEmail } = req.params;
    try {
      const { rows: existingRows } = await pool.query(
        `SELECT r.id FROM reviews r
         JOIN orders o ON r.orderid = o.orderid
         WHERE r.productid = $1 AND o.customeremail = $2`,
        [productId, customerEmail]
      );
      const { rows: orderRows } = await pool.query(
        `SELECT oi.id FROM order_items oi
         JOIN orders o ON oi.orderid = o.orderid
         WHERE oi.productid = $1 AND o.customeremail = $2`,
        [productId, customerEmail]
      );
      res.json({
        canReview: existingRows.length === 0 && orderRows.length > 0,
        hasOrdered: orderRows.length > 0,
        hasReviewed: existingRows.length > 0
      });
    } catch (err) {
      console.error('Error checking review status:', err.message);
      res.status(500).json({ error: 'Failed to check review status' });
    }
  });

  // Get reviews for a product
  router.get('/product/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
      const { rows } = await pool.query(
        `SELECT r.*, o.customername
         FROM reviews r
         JOIN orders o ON r.orderid = o.orderid
         WHERE r.productid = $1
         ORDER BY r.createdat DESC`,
        [productId]
      );
      res.json(rows);
    } catch (err) {
      console.error('Error fetching reviews:', err.message);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // Get review summary for a product
  router.get('/product/:productId/summary', async (req, res) => {
    const { productId } = req.params;
    try {
      const { rows } = await pool.query(
        `SELECT
          COUNT(*) as "totalReviews",
          COALESCE(AVG(rating), 0) as "averageRating",
          COUNT(CASE WHEN rating = 5 THEN 1 END) as "fiveStars",
          COUNT(CASE WHEN rating = 4 THEN 1 END) as "fourStars",
          COUNT(CASE WHEN rating = 3 THEN 1 END) as "threeStars",
          COUNT(CASE WHEN rating = 2 THEN 1 END) as "twoStars",
          COUNT(CASE WHEN rating = 1 THEN 1 END) as "oneStar"
         FROM reviews
         WHERE productid = $1`,
        [productId]
      );
      const raw = rows[0];
      res.json({
        totalReviews: parseInt(raw.totalReviews, 10) || 0,
        averageRating: parseFloat(raw.averageRating) || 0,
        fiveStars: parseInt(raw.fiveStars, 10) || 0,
        fourStars: parseInt(raw.fourStars, 10) || 0,
        threeStars: parseInt(raw.threeStars, 10) || 0,
        twoStars: parseInt(raw.twoStars, 10) || 0,
        oneStar: parseInt(raw.oneStar, 10) || 0,
      });
    } catch (err) {
      console.error('Error fetching review summary:', err.message);
      res.status(500).json({ error: 'Failed to fetch review summary' });
    }
  });

  return router;
};

async function updateProductRating(productId, pool) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as "totalReviews", COALESCE(AVG(rating), 0) as "averageRating"
       FROM reviews WHERE productid = $1`,
      [productId]
    );
    const { totalReviews, averageRating } = rows[0];
    await pool.query(
      `UPDATE products SET rating = $1, total_rating = $2 WHERE id = $3`,
      [parseFloat(averageRating).toFixed(1), totalReviews, productId]
    );
  } catch (err) {
    console.error('Error updating product rating:', err.message);
  }
}

export default createReviewRoutes;
