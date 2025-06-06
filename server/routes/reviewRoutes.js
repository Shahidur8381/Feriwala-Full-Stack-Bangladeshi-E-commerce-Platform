import express from 'express';

const createReviewRoutes = (db) => {
  const router = express.Router();

  // Submit a review
  router.post('/', (req, res) => {
    const { productId, orderId, rating, comment } = req.body;

    if (!productId || !orderId || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if order exists and is delivered
    db.get(`
      SELECT status FROM orders WHERE orderId = ?
    `, [orderId], (err, order) => {
      if (err) {
        console.error('Error checking order:', err.message);
        return res.status(500).json({ error: 'Failed to verify order' });
      }

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // For now, allow reviews for any order status (you can restrict to 'delivered' later)
      // if (order.status !== 'delivered') {
      //   return res.status(400).json({ error: 'Can only review delivered orders' });
      // }

      // Check if review already exists for this product and order
      db.get(`
        SELECT id FROM reviews WHERE productId = ? AND orderId = ?
      `, [productId, orderId], (err, existingReview) => {
        if (err) {
          console.error('Error checking existing review:', err.message);
          return res.status(500).json({ error: 'Failed to check existing review' });
        }

        if (existingReview) {
          return res.status(400).json({ error: 'Review already exists for this product' });
        }

        // Insert review
        db.run(`
          INSERT INTO reviews (productId, orderId, rating, comment)
          VALUES (?, ?, ?, ?)
        `, [productId, orderId, rating, comment], function(err) {
          if (err) {
            console.error('Error inserting review:', err.message);
            return res.status(500).json({ error: 'Failed to submit review' });
          }

          // Update product rating
          updateProductRating(productId, db);

          res.status(201).json({ 
            id: this.lastID, 
            message: 'Review submitted successfully' 
          });
        });
      });
    });
  });

  // Get reviews for a product
  router.get('/product/:productId', (req, res) => {
    const { productId } = req.params;

    db.all(`
      SELECT r.*, o.customerName 
      FROM reviews r
      JOIN orders o ON r.orderId = o.orderId
      WHERE r.productId = ?
      ORDER BY r.createdAt DESC
    `, [productId], (err, reviews) => {
      if (err) {
        console.error('Error fetching reviews:', err.message);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
      }

      res.json(reviews);
    });
  });

  // Get review summary for a product
  router.get('/product/:productId/summary', (req, res) => {
    const { productId } = req.params;

    db.get(`
      SELECT 
        COUNT(*) as totalReviews,
        AVG(rating) as averageRating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as fiveStars,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as fourStars,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as threeStars,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as twoStars,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as oneStar
      FROM reviews 
      WHERE productId = ?
    `, [productId], (err, summary) => {
      if (err) {
        console.error('Error fetching review summary:', err.message);
        return res.status(500).json({ error: 'Failed to fetch review summary' });
      }

      res.json(summary);
    });
  });

  return router;
};

// Helper function to update product rating
function updateProductRating(productId, db) {
  db.get(`
    SELECT COUNT(*) as totalReviews, AVG(rating) as averageRating
    FROM reviews WHERE productId = ?
  `, [productId], (err, result) => {
    if (err) {
      console.error('Error calculating product rating:', err.message);
      return;
    }

    const { totalReviews, averageRating } = result;
    
    db.run(`
      UPDATE products 
      SET rating = ?, total_rating = ?
      WHERE id = ?
    `, [averageRating.toFixed(1), totalReviews, productId], (updateErr) => {
      if (updateErr) {
        console.error('Error updating product rating:', updateErr.message);
      } else {
        console.log(`Updated product ${productId} rating: ${averageRating.toFixed(1)} (${totalReviews} reviews)`);
      }
    });
  });
}

export default createReviewRoutes;
