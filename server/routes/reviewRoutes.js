import express from 'express';

const createReviewRoutes = (db) => {
  const router = express.Router();

  // Submit a review
  router.post('/', (req, res) => {
    const { productId, orderId, rating, comment, customerEmail } = req.body;

    console.log('Review submission data:', { productId, orderId, rating, comment, customerEmail });

    if (!productId || !orderId || !rating || !customerEmail) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields (productId, orderId, rating, customerEmail)' });
    }

    if (rating < 1 || rating > 5) {
      console.log('Invalid rating:', rating);
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if order exists and belongs to the customer
    db.get(`
      SELECT status, customerEmail FROM orders WHERE orderId = ?
    `, [orderId], (err, order) => {
      if (err) {
        console.error('Error checking order:', err.message);
        return res.status(500).json({ error: 'Failed to verify order' });
      }

      if (!order) {
        console.log('Order not found:', orderId);
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.customerEmail !== customerEmail) {
        console.log('Email mismatch:', order.customerEmail, 'vs', customerEmail);
        return res.status(403).json({ error: 'Unauthorized to review this order' });
      }

      // Check if user has already reviewed this product (regardless of order)
      db.get(`
        SELECT r.id FROM reviews r
        JOIN orders o ON r.orderId = o.orderId
        WHERE r.productId = ? AND o.customerEmail = ?
      `, [productId, customerEmail], (err, existingReview) => {
        if (err) {
          console.error('Error checking existing review:', err.message);
          return res.status(500).json({ error: 'Failed to check existing review' });
        }

        if (existingReview) {
          console.log('Review already exists for product:', productId, 'by user:', customerEmail);
          return res.status(400).json({ error: 'You have already reviewed this product' });
        }

        // Check if the product was actually ordered in this order
        db.get(`
          SELECT id FROM order_items WHERE orderId = ? AND productId = ?
        `, [orderId, productId], (err, orderItem) => {
          if (err) {
            console.error('Error checking order item:', err.message);
            return res.status(500).json({ error: 'Failed to verify order item' });
          }

          if (!orderItem) {
            console.log('Product not found in order:', productId, 'in', orderId);
            return res.status(400).json({ error: 'Product not found in this order' });
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

            console.log('Review submitted successfully:', this.lastID);
            // Update product rating
            updateProductRating(productId, db);

            res.status(201).json({ 
              id: this.lastID, 
              message: 'Review submitted successfully'            });
          });
        });
      });
    });
  });

  // Update a review
  router.put('/:reviewId', (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment, customerEmail } = req.body;

    if (!rating || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields (rating, customerEmail)' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if review exists and belongs to the customer
    db.get(`
      SELECT r.*, o.customerEmail 
      FROM reviews r
      JOIN orders o ON r.orderId = o.orderId
      WHERE r.id = ?
    `, [reviewId], (err, review) => {
      if (err) {
        console.error('Error checking review:', err.message);
        return res.status(500).json({ error: 'Failed to verify review' });
      }

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      if (review.customerEmail !== customerEmail) {
        return res.status(403).json({ error: 'Unauthorized to update this review' });
      }

      // Update review
      db.run(`
        UPDATE reviews 
        SET rating = ?, comment = ?, createdAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [rating, comment, reviewId], function(err) {
        if (err) {
          console.error('Error updating review:', err.message);
          return res.status(500).json({ error: 'Failed to update review' });
        }

        // Update product rating
        updateProductRating(review.productId, db);

        res.json({ 
          message: 'Review updated successfully' 
        });
      });
    });
  });

  // Get user's review for a specific product
  router.get('/user/:customerEmail/product/:productId', (req, res) => {
    const { customerEmail, productId } = req.params;

    db.get(`
      SELECT r.*, o.customerName 
      FROM reviews r
      JOIN orders o ON r.orderId = o.orderId
      WHERE r.productId = ? AND o.customerEmail = ?
    `, [productId, customerEmail], (err, review) => {
      if (err) {
        console.error('Error fetching user review:', err.message);
        return res.status(500).json({ error: 'Failed to fetch review' });
      }

      res.json(review || null);
    });
  });

  // Check if user can review a product
  router.get('/can-review/:productId/:customerEmail', (req, res) => {
    const { productId, customerEmail } = req.params;

    // Check if user has already reviewed this product
    db.get(`
      SELECT r.id FROM reviews r
      JOIN orders o ON r.orderId = o.orderId
      WHERE r.productId = ? AND o.customerEmail = ?
    `, [productId, customerEmail], (err, existingReview) => {
      if (err) {
        console.error('Error checking existing review:', err.message);
        return res.status(500).json({ error: 'Failed to check review status' });
      }

      // Check if user has ordered this product
      db.get(`
        SELECT oi.id FROM order_items oi
        JOIN orders o ON oi.orderId = o.orderId
        WHERE oi.productId = ? AND o.customerEmail = ?
      `, [productId, customerEmail], (err, orderItem) => {
        if (err) {
          console.error('Error checking order history:', err.message);
          return res.status(500).json({ error: 'Failed to check order history' });
        }

        res.json({
          canReview: !existingReview && !!orderItem,
          hasOrdered: !!orderItem,
          hasReviewed: !!existingReview
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
